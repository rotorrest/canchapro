# Modulo de Disponibilidad — Availability Engine

> Fecha: marzo 2026
> Referencia: mesa247/m-b-core/services/api/app/core/availability_engine

---

## 1. Contexto

El sistema actual tiene dos subsistemas de horarios coexistiendo (legacy `courtSchedules` + nuevo `Schedules` con versiones), generacion de slots hardcodeada a 1 hora, precios en tabla separada, y sin validaciones reales de duracion, antelacion ni limites.

Este documento define el motor de disponibilidad unificado, inspirado en el availability engine de mesa247 (motor de produccion para restaurantes, adaptado a canchas deportivas).

---

## 2. Mapeo de conceptos: Restaurante → Canchas

| mesa247 (restaurante) | CanchaPro (canchas) | Notas |
|---|---|---|
| Mesa (table) | Court (cancha) | Entidad reservable |
| Ambiente (zone) | Sede (location) | Agrupacion fisica |
| Turno (lunch/dinner) | Turno (morning/afternoon/evening) | Periodos con config diferente |
| ProgramacionReserva | Schedule + ScheduleRule | Config de horarios + precios |
| ProgramacionReserva.fecha | ScheduleRule.specific_date | Override por fecha especifica |
| ProgramacionReserva.dia | ScheduleRule.day_of_week | Horario semanal recurrente |
| HorarioCerrado | CourtBlock (multi-nivel) | Bloqueos |
| TiempoServicio | SlotDuration | Duracion del turno |
| Anticipacion | MinAdvanceMinutes | Antelacion minima |
| MaxPaxPorHora | MaxBookingsPerHour | Limite de capacidad |
| HoraMaximaReservar | BookingDeadline | Hora limite para reservar |
| Rotacion (seatings/slot) | No aplica | Canchas = 1 booking/slot |
| TipoConsumo | BookingType | Tipo de reserva |
| SlotStatus matrix (numpy) | SlotStatus enum | Core del motor |

### Diferencias clave con restaurantes

1. **Sin rotacion** — una cancha = 1 booking por slot (restaurantes pueden tener multiples seatings por mesa)
2. **Sin combinacion de mesas** — canchas no se "juntan" (restaurantes combinan mesas para grupos grandes)
3. **Creditos vs dinero** — canchas cobran en creditos pre-pagados, restaurantes cobran al final
4. **Limite por socio** — en vez de max personas/hora, limitamos reservas/socio/dia
5. **Buffer de limpieza** — entre turnos de cancha puede haber tiempo de preparacion (no existe en restaurantes)

---

## 3. Arquitectura: Snapshot → Build → Compute

Adoptado de mesa247. El motor NUNCA toca la DB durante el calculo.

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Data Layer       │     │  Builder     │     │  Engine          │
│  (fetch upfront)  │ ──→ │  (normalize) │ ──→ │  (pure compute)  │
│                   │     │              │     │                  │
│  - config         │     │  Raw SQL →   │     │  Input: snapshot │
│  - schedule_rules │     │  typed       │     │  Output: slots[] │
│  - court_blocks   │     │  domain      │     │                  │
│  - bookings       │     │  objects     │     │  No I/O          │
│  - courts         │     │              │     │  No side effects │
│                   │     │              │     │  Testeable        │
│  Queries run in   │     │              │     │  Cacheable       │
│  parallel         │     │              │     │                  │
└──────────────────┘     └──────────────┘     └──────────────────┘
```

### Invariante fundamental (de mesa247)

> Una vez que un slot es BLOCKED u OCCUPIED, **ninguna regla posterior puede reabrirlo**. Cada regla solo puede transicionar `AVAILABLE → BLOCKED` o `AVAILABLE → OCCUPIED`.

```typescript
function applyRule(slot: Slot, newStatus: SlotStatus): void {
  if (slot.status !== SlotStatus.AVAILABLE) return; // NEVER reopen
  slot.status = newStatus;
}
```

---

## 4. Modelo de datos

### 4.1 SlotStatus

```typescript
enum SlotStatus {
  AVAILABLE = 0,     // Disponible para reservar
  OCCUPIED = 1,      // Ya tiene booking confirmado
  BLOCKED = -2,      // Bloqueado (mantenimiento, evento, etc)
  OUTSIDE = -1,      // Fuera del horario operativo
  PAST = -3,         // Ya paso (hoy)
  TOO_SOON = -4,     // Dentro de la antelacion minima
  LIMIT_REACHED = -5,// Socio alcanzo su limite diario
  DEADLINE = -6,     // Paso la hora limite de reserva
  TOO_FAR = -7,      // Fuera de la ventana de reserva anticipada
  BUFFER = -8,       // Buffer de limpieza entre turnos
}
```

### 4.2 DB Schema

```sql
-- Config global del tenant (1 row por tenant)
availability_config (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
  default_slot_duration INTEGER NOT NULL DEFAULT 60,
  min_advance_minutes INTEGER NOT NULL DEFAULT 120,
  max_advance_days INTEGER NOT NULL DEFAULT 60,
  max_bookings_per_member_per_day INTEGER NOT NULL DEFAULT 2,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  no_show_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  auto_cancel_no_show INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Schedules (agrupador de reglas)
schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Schedule rules (el core — equivalente a ProgramacionReserva)
schedule_rules (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id),
  court_id TEXT REFERENCES courts(id),       -- null = aplica a todas las canchas del schedule
  day_of_week INTEGER,                        -- 0-6, Mon=0 (null si specific_date)
  specific_date TEXT,                          -- YYYY-MM-DD (null si day_of_week)
  start_time TEXT NOT NULL,                    -- "06:00"
  end_time TEXT NOT NULL,                      -- "22:00"
  slot_duration_override INTEGER,              -- null = usa config global
  price_per_slot REAL NOT NULL,                -- creditos
  booking_deadline_time TEXT,                  -- "18:00" = no se puede reservar este rango despues de las 18:00
  is_closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Court blocks (mejorado: multi-nivel)
court_blocks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  scope TEXT NOT NULL DEFAULT 'court',        -- 'tenant' | 'sede' | 'court'
  sede_id TEXT REFERENCES sedes(id),           -- si scope = 'sede'
  court_id TEXT REFERENCES courts(id),         -- si scope = 'court'
  date TEXT NOT NULL,
  start_time TEXT,                              -- null = todo el dia
  end_time TEXT,                                -- null = todo el dia
  reason TEXT DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookings (ya existe, sin cambios)
-- bookings: id, tenantId, memberId, courtId, startTime, endTime, creditsDeducted, status
```

### 4.3 Resolucion de reglas (Fecha vs Dia — de mesa247)

Regla binaria, nunca se mezclan:

```
Para Court X en Date D:

1. Buscar schedule_rules WHERE specific_date = D
   AND (court_id = X OR court_id IS NULL)

2. Si HAY resultados → usar SOLO esos (override completo)
   Si NO HAY → buscar WHERE day_of_week = D.weekday
   AND (court_id = X OR court_id IS NULL)

3. Dentro de cada grupo: court_id especifico > court_id NULL
   (regla de cancha especifica gana sobre regla global)
```

---

## 5. Pipeline de reglas

Orden estricto. Cada regla solo restringe.

```
Input: config, rules[], blocks[], bookings[], court, date, memberId?, now

Step 0: Generate initial slots from rules
        → All AVAILABLE with price from rule

Step 1: Apply bookings → OCCUPIED
        Overlap detection: slotStart < bookingEnd && bookingStart < slotEnd

Step 2: Apply blocks → BLOCKED
        Multi-nivel: tenant blocks, sede blocks, court blocks
        Overlap detection con rangos horarios

Step 3: Apply buffer → BUFFER
        Si buffer_minutes > 0 y hay booking adyacente

Step 4: Apply member limit → LIMIT_REACHED
        Si memberBookingsToday >= max_bookings_per_member_per_day

Step 5: Apply anticipation → PAST | TOO_SOON
        Si slotDatetime <= now → PAST
        Si slotDatetime - now < min_advance_minutes → TOO_SOON

Step 6: Apply deadline → DEADLINE
        Si rule.booking_deadline_time y now > deadline

Step 7: Apply max advance → TOO_FAR
        Si date - today > max_advance_days

Step 8: Apply price multiplier
        slot.price = round(rule.price_per_slot * court.priceMultiplier, 1)

Output: slots[] con status, price, reason
```

---

## 6. API Endpoints

```
-- Disponibilidad (lectura)
GET  /v1/availability/:courtId?date=YYYY-MM-DD[&memberId=...]
     → { slots: [{ startTime, endTime, status, price, durationMinutes, reason? }] }

GET  /v1/availability/calendar?courtId=X&month=2026-03
     → { dates: [{ date, hasAvailability, totalSlots, availableSlots }] }

GET  /v1/availability/bulk?courtIds=c1,c2,c3&date=2026-03-27
     → { courts: { c1: { slots: [...] }, c2: { slots: [...] } } }

-- Configuracion (super_admin)
GET  /v1/availability/config
PUT  /v1/availability/config

-- Schedules (super_admin)
GET    /v1/schedules
POST   /v1/schedules
PUT    /v1/schedules/:id
DELETE /v1/schedules/:id

-- Schedule rules (super_admin)
GET    /v1/schedules/:id/rules
POST   /v1/schedules/:id/rules
PUT    /v1/schedules/:id/rules/:ruleId
DELETE /v1/schedules/:id/rules/:ruleId

-- Blocks (staff+)
GET    /v1/blocks?date=YYYY-MM-DD[&courtId=X]
POST   /v1/blocks
DELETE /v1/blocks/:id
```

### Performance headers (de mesa247)

```
X-Timing-Total-Ms: 45
X-Timing-Queries-Ms: 12
X-Timing-Build-Ms: 3
X-Timing-Compute-Ms: 30
```

---

## 7. Overlap detection

Con duraciones variables (30, 60, 90, 120 min) NO se puede usar exact match.

```typescript
// INCORRECTO (actual):
const booked = bookings.some(b => b.startTime === slotStartISO);

// CORRECTO (nuevo):
function overlaps(slotStart: number, slotEnd: number, bookingStart: number, bookingEnd: number): boolean {
  return slotStart < bookingEnd && bookingStart < slotEnd;
}
```

Ejemplo: booking de 90 min (08:00-09:30) ocupa slots de 30 min: 08:00, 08:30, 09:00.

---

## 8. Bloqueos multi-nivel

```
scope = "tenant"  → bloquea TODAS las canchas de TODAS las sedes
scope = "sede"    → bloquea todas las canchas de UNA sede
scope = "court"   → bloquea UNA cancha especifica
```

Un solo registro "1 de mayo — Feriado — scope: tenant" cierra todo.

Resolucion:
```
blocks_for_court(courtId, date) =
  blocks WHERE scope = 'tenant' AND date = D
  UNION
  blocks WHERE scope = 'sede' AND sede_id = court.sedeId AND date = D
  UNION
  blocks WHERE scope = 'court' AND court_id = courtId AND date = D
```

---

## 9. Mejoras adoptadas de mesa247

| # | Mejora | Origen mesa247 | Impacto |
|---|---|---|---|
| 1 | Snapshot → Build → Compute | Arquitectura core | Testeable, cacheable, sin I/O en compute |
| 2 | Batch/calendar endpoint | GET /v2/search con date range | UX: calendario del socio sin 120 requests |
| 3 | Fecha override dia (binario) | _active_schedules_for_date() | Elimina bugs de mezcla de reglas |
| 4 | Bloqueos multi-nivel | HorarioCerrado (3 granularidades) | 1 registro = cerrar todo el club |
| 5 | Pipeline solo restringe | Invariante del engine | Seguridad: nunca se reabre un slot |
| 6 | Overlap detection real | _time_to_slot_idx() | Critico para duraciones variables |
| 7 | Deadline per-rule | hora_maxima_reservar per schedule | Flexibility: deadline diferente por turno |
| 8 | Tipos de reserva (futuro) | TipoConsumo | Regular, clase, torneo, evento |
| 9 | Auto no-show + tolerancia | tolerancia config | Reduce trabajo manual del staff |
| 10 | Performance headers | X-Timing-*-Ms | Monitoring en produccion |

---

## 10. Lo que se elimina

- `courtSchedules` table → migra a `schedule_rules` (day_of_week + start/end + price)
- `creditPrices` table → migra a `schedule_rules.price_per_slot`
- Constantes hardcodeadas `SLOT_HOURS`, `MIN_BOOKING_MINUTES`, `BOOKING_WINDOW_DAYS` → migran a `availability_config`
- Generacion de slots hora-por-hora en API → reemplazada por engine con duracion configurable
- `creditsRequired = 1 // placeholder` → calculado por el engine

## Lo que se mantiene

- `courts` table — sin cambios
- `bookings` table — sin cambios estructurales (solo mejora validacion)
- Versionado de courts (CourtVersion) — ya existe en frontend

---

## 11. UI — Paginas del modulo

### 11.1 Tab "Disponibilidad" en /courts

Nuevo tab en CourtsPage con 3 secciones:

**Seccion A: Config global**
- Card editable con los settings del tenant
- Duracion del turno, antelacion, ventana, limite/socio, buffer

**Seccion B: Horarios (schedules + rules)**
- Selector de schedule activo
- Tabla de reglas: dia/fecha, rango, duracion, precio, cancha
- CRUD de reglas con formulario
- Visual: rangos de colores por precio

**Seccion C: Vista previa**
- Grilla visual tipo AgendaPage
- Muestra los slots generados para una fecha seleccionada
- Colores por status (disponible, ocupado, bloqueado)
- Precios visibles en cada slot

### 11.2 Mejoras a BookCourtPage

- Calendario con indicador de disponibilidad por dia (batch endpoint)
- Slots con duracion variable mostrada
- Badge de precio por slot
- Mensajes claros por status (too_soon, limit_reached, etc.)

### 11.3 Mejoras a AgendaPage

- Soportar slots de duracion variable (no solo 1h)
- Mostrar bloqueos multi-nivel con icono diferente
- Mostrar buffer zones en gris claro

---

## 12. Plan de implementacion

| Fase | Que |
|---|---|
| **Fase 1: UI** | Tab Disponibilidad, config global, schedule editor, preview |
| **Fase 2: Backend schema** | Tablas: availability_config, schedules, schedule_rules, court_blocks mejorado |
| **Fase 3: Backend engine** | Snapshot → Build → Compute pipeline |
| **Fase 4: Backend API** | Endpoints de availability, schedules, blocks |
| **Fase 5: Integracion** | Conectar BookCourtPage y AgendaPage a nueva API |
| **Fase 6: Migracion** | Seed legacy data → nuevo schema |
