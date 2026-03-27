# CanchaPro — Modelo de Precios

*Todos los precios en Soles (S/). Sesion promedio en Peru: S/ 100–120.*

---

## Planes

| Tier | Canchas | Base/mes | Fee/reserva |
|---|---|---|---|
| **Starter** | 1–2 | **Gratis** | **S/ 0.50** |
| **Pro** | 3–9 | **S/ 79** | **S/ 0.35** |
| **Business** | 10+ | **S/ 149** | **S/ 0.20** |

- Starter: 150 reservas gratis/mes, luego S/ 0.50 por reserva
- Pro y Business: reservas ilimitadas + fee operacional
- **El fee baja al subir de plan** — incentivo real para upgrade
- Ningún club paga más del 0.5% de su ingreso

---

## Simulaciones

| Club | Canchas | Reservas/mes | Base | Variable | **Total** | Ingreso club | **% ingreso** |
|---|---|---|---|---|---|---|---|
| Micro | 2 | 200 | S/ 0 | S/ 25 | **S/ 25** | ~S/ 22,000 | 0.1% |
| Pequeño | 5 | 700 | S/ 79 | S/ 245 | **S/ 324** | ~S/ 60,000 | 0.5% |
| Mediano | 10 | 2,000 | S/ 149 | S/ 400 | **S/ 549** | ~S/ 120,000 | 0.5% |
| Grande | 16 | 4,000 | S/ 149 | S/ 800 | **S/ 949** | ~S/ 240,000 | 0.4% |

*Ingreso club estimado: canchas × 16 hrs/dia × 30 dias × ocupacion × S/ 110 promedio.*

**Copy para venta: "Una sola hora de cancha paga el sistema por 2 semanas."**

---

## Unit economics

| | Starter | Pro | Business |
|---|---|---|---|
| Pago mensual promedio | S/ 25 | S/ 324 | S/ 549 |
| Costo infra por club | S/ 5 | S/ 15 | S/ 25 |
| **Profit por club** | **S/ 20** | **S/ 309** | **S/ 524** |
| **Margen** | 80% | 95% | 95% |

---

## Costos fijos mensuales

| Concepto | S/ |
|---|---|
| 1 dev senior (Peru) | 7,000 |
| Infra base (Cloudflare Workers, dominio) | 100 |
| WhatsApp Business API | 150 |
| Herramientas (GitHub, Resend, monitoring) | 100 |
| **Total** | **S/ 7,350** |

---

## Break-even

### Por tipo de club (si solo tuvieras ese tipo)

| Solo clubs... | Profit/club | Clubs para break-even |
|---|---|---|
| Pro | S/ 309 | **24 clubs** |
| Business | S/ 524 | **14 clubs** |
| Mix 50/50 Pro+Business | S/ 417 | **18 clubs** |

### Mix realista (40% free, 45% Pro, 15% Business)

| Clubs totales | Free | Pro | Business | MRR | Costos | **Profit** |
|---|---|---|---|---|---|---|
| 10 | 4 | 5 | 1 | S/ 2,194 | S/ 7,450 | **-S/ 5,256** |
| 20 | 8 | 9 | 3 | S/ 4,928 | S/ 7,550 | **-S/ 2,622** |
| **27** | **11** | **12** | **4** | **S/ 7,384** | **S/ 7,620** | **~S/ 0** |
| 35 | 14 | 16 | 5 | S/ 9,939 | S/ 7,700 | **+S/ 2,239** |
| 50 | 20 | 23 | 7 | S/ 14,530 | S/ 7,850 | **+S/ 6,680** |

### **Break-even: ~27 clubs totales (~16 pagando)**

En Peru con ~150+ clubs de padel creciendo 30% anual, capturar 27 es alcanzable en **6–8 meses** con venta directa.

### Sensibilidad

| Si... | Break-even cambia a |
|---|---|
| Dev cobra S/ 5,000 (junior) | 20 clubs |
| Agregas 2do dev (S/ 14,000 total) | 45 clubs |
| ARPU sube 20% (subes fees) | 23 clubs |
| 0% free tier (todos pagan) | 21 clubs |
| Club promedio tiene 8 canchas (mas reservas) | 22 clubs |

---

## Proyeccion de revenue

| Mes | Clubs | Free | Pro | Business | MRR | Costos | **Profit** | **Acumulado** |
|---|---|---|---|---|---|---|---|---|
| 1 | 3 | 2 | 1 | 0 | S/ 374 | S/ 7,370 | -S/ 6,996 | -S/ 6,996 |
| 3 | 8 | 4 | 3 | 1 | S/ 1,621 | S/ 7,420 | -S/ 5,799 | -S/ 19,294 |
| 6 | 15 | 6 | 7 | 2 | S/ 3,914 | S/ 7,500 | -S/ 3,586 | -S/ 30,148 |
| 9 | 22 | 9 | 10 | 3 | S/ 5,982 | S/ 7,580 | -S/ 1,598 | -S/ 35,542 |
| **12** | **30** | **12** | **14** | **4** | **S/ 8,702** | **S/ 7,700** | **+S/ 1,002** | **-S/ 33,486** |
| 18 | 42 | 17 | 19 | 6 | S/ 12,458 | S/ 7,880 | +S/ 4,578 | -S/ 9,574 |
| **21** | **48** | **19** | **22** | **7** | S/ 14,684 | S/ 7,950 | +S/ 6,734 | **~S/ 0** |
| 24 | 55 | 22 | 25 | 8 | S/ 16,930 | S/ 8,050 | +S/ 8,880 | +S/ 22,700 |

### Hitos clave

- **Mes 9:** MRR cubre ~80% de costos
- **Mes 12:** Break-even mensual (MRR > costos)
- **Mes 21:** Break-even acumulado (recuperas toda la inversion)
- **Mes 24:** +S/ 22,700 de profit acumulado, S/ 8,880/mes de profit

### Inversion total necesaria

**~S/ 35,000** para llegar a break-even mensual (mes 12). Se recupera en mes 21.

---

## Sistema de tarifarios

Cada plan tiene un **tarifario** con fecha de vigencia. Esto permite:

1. **Cambiar precios para nuevos clubs** sin afectar los actuales
2. **Migrar clubs existentes** a un nuevo tarifario cuando se quiera
3. **Mantener historial** de que tarifa aplico a cada factura

### Estructura

```
Tarifario "Lanzamiento 2026"
  vigente_desde: 2026-04-01
  planes:
    starter: { base: 0, fee: 0.50, reservas_gratis: 150 }
    pro:     { base: 79, fee: 0.35 }
    business:{ base: 149, fee: 0.20 }

Tarifario "Q3 2026" (ejemplo futuro)
  vigente_desde: 2026-07-01
  planes:
    starter: { base: 0, fee: 0.75, reservas_gratis: 100 }
    pro:     { base: 99, fee: 0.35 }
    business:{ base: 179, fee: 0.20 }
```

### Reglas

- Un club se **registra con el tarifario vigente** en su fecha de alta
- El club **mantiene su tarifario** hasta que el admin de Lumini lo migre
- Al crear un nuevo tarifario, los clubs existentes **no cambian automaticamente**
- Migracion: desde el panel Lumini se puede cambiar el tarifario de un club individual o en bulk
- Cada factura registra **que tarifario aplico**, para auditoria
- Los clubs pueden ver su tarifario actual desde su panel

### En la base de datos

```sql
CREATE TABLE rate_cards (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  effective_from DATE NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE rate_card_plans (
  id            TEXT PRIMARY KEY,
  rate_card_id  TEXT REFERENCES rate_cards(id),
  plan          TEXT NOT NULL,
  base_price    DECIMAL NOT NULL,
  fee_per_booking DECIMAL NOT NULL,
  free_bookings INTEGER DEFAULT 0,
  max_courts    INTEGER
);

ALTER TABLE tenants ADD COLUMN rate_card_id TEXT REFERENCES rate_cards(id);

CREATE TABLE invoices (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT REFERENCES tenants(id),
  period      TEXT NOT NULL,
  plan        TEXT NOT NULL,
  base_price  DECIMAL NOT NULL,
  bookings_count INTEGER NOT NULL,
  fee_per_booking DECIMAL NOT NULL,
  free_bookings INTEGER NOT NULL,
  variable_total DECIMAL NOT NULL,
  total       DECIMAL NOT NULL,
  rate_card_id TEXT REFERENCES rate_cards(id),
  rate_card_name TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
```

---

## Features por tier

```
STARTER (Gratis)              PRO (S/ 79/mes)             BUSINESS (S/ 149/mes)
1–2 canchas                   3–9 canchas                  10+ canchas
150 reservas gratis/mes       Reservas ilimitadas          Reservas ilimitadas
+ S/ 0.50/reserva extra       + S/ 0.35/reserva            + S/ 0.20/reserva

✓ Reservas online             ✓ Todo en Starter            ✓ Todo en Pro
✓ Gestion de socios           ✓ Dashboard y metricas       ✓ Multi-sede
✓ Creditos basico             ✓ QR check-in                ✓ Custom domain
✓ Horarios y bloqueos         ✓ Reportes exportables       ✓ Branding personalizado
                              ✓ WhatsApp Recordatorios     ✓ WhatsApp Recordatorios
                              ✓ Soporte WhatsApp           ✓ Soporte prioritario
                                                           ✓ API access
```

---

## Add-ons futuros

| Add-on | Precio | Disponible desde |
|---|---|---|
| Torneos | S/ 39/mes | Pro+ |
| Marketing automation | S/ 49/mes | Pro+ |
| Coach management | S/ 39/mes | Pro+ |
| RFID/IoT | S/ 79/mes | Business+ |
| White-label app | S/ 149/mes | Business+ |

---

*Modelo de precios v4.0 · Marzo 2026 · Lumini*
