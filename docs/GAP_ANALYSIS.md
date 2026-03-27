# Gap Analysis — CanchaPro MVP

> Estado: marzo 2026. Análisis del delta entre lo que existe y lo que se necesita para lanzar.

---

## Resumen ejecutivo

El proyecto tiene una base sólida: schema completo, estructura multi-tenant, SPA con todas las páginas, y rutas de API parciales. Pero hay **tres brechas críticas** que bloquean el lanzamiento:

1. **El frontend no habla con el backend** — todo es mock data
2. **La lógica de negocio central está incompleta** — el motor de créditos no funciona
3. **Las operaciones async no tienen consumer** — las notificaciones nunca se envían

---

## 1. Backend — Lógica de negocio incompleta

### Crítico (bloquea operación)

| Problema | Archivo | Detalle |
|---|---|---|
| Créditos hardcodeados a `1` | `routes/bookings.ts:43` | `const creditsRequired = 1 // placeholder` — nunca se consulta `credit_prices` |
| Cancelación no devuelve créditos | `routes/bookings.ts` | Al cancelar solo cambia el status; no hay refund al balance del socio ni log en `credit_transactions` |
| Overlap check primitivo | `routes/bookings.ts:35` | Solo verifica `startTime` exacto — una reserva de 9:00–10:00 no bloquea una de 9:30 |
| Court blocks ignorados | `routes/courts.ts` | La disponibilidad no consulta `court_blocks` — el admin puede bloquear una cancha pero igual se puede reservar |
| Schedule PUT no existe | `routes/courts.ts` | Solo hay GET de horarios, no hay forma de actualizarlos vía API |
| Reset de contraseña incompleto | `routes/auth.ts` | Solo encola una notificación; no hay tabla de tokens, no hay endpoint para confirmar el reset |

### Rutas que faltan completamente

```
GET    /v1/credit-prices              ← tabla existe, ruta no
PUT    /v1/credit-prices              ← idem
POST   /v1/credit-sales               ← registro de venta de créditos
GET    /v1/courts/:id/blocks          ← listar bloqueos
POST   /v1/courts/:id/blocks          ← crear bloqueo
DELETE /v1/courts/:id/blocks/:blockId ← eliminar bloqueo
PUT    /v1/courts/:id/schedule        ← actualizar horario
PUT    /v1/members/:id                ← editar socio (status, allocation)
GET    /v1/members/:id                ← perfil de socio
GET    /v1/bookings/:id               ← detalle de reserva
PATCH  /v1/bookings/:id/status        ← staff: marcar no-show / completado
GET    /v1/dashboard/stats            ← KPIs del dashboard
GET    /v1/dashboard/chart-data       ← datos para gráficos
GET    /v1/agenda?date=...            ← vista de agenda por día
```

### Lógica async sin consumer

La Queue `NOTIFICATIONS_QUEUE` recibe mensajes en `auth.ts` y `bookings.ts` pero **no hay ningún Consumer Worker implementado**. Los mensajes se encolan y desaparecen. Nadie envía el email ni el WhatsApp.

Tipos de mensajes encolados sin procesar:
- `booking_confirmed` → debería enviar email + WhatsApp al socio
- `password_reset` → debería enviar email con link de reset
- (falta) `welcome` — bienvenida al registrarse
- (falta) `monthly_reset` — reset de créditos cada mes (necesita Cron Trigger)

---

## 2. Frontend — Desconectado del backend

### El problema principal

**Todo el frontend usa mock data.** El `authStore` llama a `authenticateUser()` que viene de `mock-data.ts`. Ninguna página hace un fetch real.

```ts
// authStore.ts — esto hay que reemplazar completamente
import { MOCK_USERS, authenticateUser, getTenantById } from "@/lib/mock-data";
```

No existe ningún API client. No hay:
- Función `fetch` wrapeada con base URL + headers
- Manejo de JWT en headers
- Tipos compartidos para las respuestas de la API
- Estados de loading / error en ninguna página

### Páginas con funcionalidad no conectada

| Página | Qué funciona hoy | Qué necesita API real |
|---|---|---|
| `LoginPage` | Login con mock | POST `/v1/auth/login` |
| `BookCourtPage` | UI completa | GET courts + availability, POST booking |
| `MyBookingsPage` | Lista mock | GET `/v1/bookings` (member) |
| `CourtsPage` | CRUD mock | CRUD real + schedules + blocks |
| `BookingsPage` | Tabla mock | GET `/v1/bookings` (staff) + PATCH status |
| `MembersPage` | Tabla mock | GET `/v1/members` + credit ops |
| `MemberProfilePage` | Perfil mock | GET `/v1/members/:id` + transactions |
| `CreditsPage` | Formulario mock | POST `/v1/members/:id/credits` + sales |
| `DashboardPage` | Charts mock | GET `/v1/dashboard/stats` |
| `BrandingPage` | Formulario mock | PUT `/v1/site/config` + POST upload |
| `BillingPage` | Tabla mock | GET invoices real |
| `AgendaPage` | Vista mock | GET `/v1/agenda?date=...` |

### Ruta faltante en App.tsx

`AgendaPage` existe como archivo (`web/src/pages/AgendaPage.tsx`) pero **no está registrada en ninguna ruta** de `App.tsx`. También falta en el `Layout` / navegación lateral.

---

## 3. Schema — Tablas sin soporte completo

### Tabla sin ninguna ruta

| Tabla | Uso en API |
|---|---|
| `credit_prices` | Existe en schema, **cero endpoints** |
| `credit_sales` | Existe en schema, **cero endpoints** |
| `court_blocks` | Existe en schema, **cero endpoints** |
| `court_schedules` | Solo GET, falta PUT |
| `rate_cards` / `rate_card_plans` | Existen, **cero endpoints de gestión** |
| `invoices` | Existe, **cero endpoints**, nunca se genera ninguna |
| `tenant_branding` | Existe, solo se gestiona via KV (`site:slug`), hay inconsistencia |

### Tabla que falta

`password_reset_tokens` — no existe en el schema. El flujo de reset de contraseña no puede implementarse sin ella.

```ts
// Falta agregar:
passwordResetTokens: sqliteTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id").references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
})
```

---

## 4. Seguridad

| Issue | Severidad | Detalle |
|---|---|---|
| SHA-256 para hashing de passwords | Alta | SHA-256 es fast hash — vulnerable a brute force. Usar PBKDF2 (disponible en Workers Web Crypto) |
| CORS permite cualquier origen | Media | `origin: (origin) => origin` — en producción debe ser whitelist |
| JWT payload sin email/name | Media | `authMiddleware` setea `email: ""` y `name: ""` — las rutas que necesiten mostrar info del usuario tienen datos vacíos |
| Register sin validación de tenant | Media | Cualquiera puede registrarse en cualquier tenant si conoce el `tenantId`. Debería verificar que el tenant existe y está activo |
| Sin rate limiting en `/auth/login` | Media | Endpoint de login expuesto a brute force sin ningún límite |

---

## 5. Infraestructura

### Sin migrations

Existe `drizzle.config.ts` y el schema, pero **no hay archivos de migración generados**. La DB no se puede inicializar en un ambiente nuevo sin correr `db:generate` + `db:migrate`.

### Sin seed data

No hay script de seed para desarrollo. Cada vez que se crea un ambiente local hay que crear datos manualmente.

### R2 sin endpoint de serving

`site.ts` sube archivos a R2 y retorna una URL `/uploads/{key}`, pero **no hay ninguna ruta que sirva esos archivos**. Las imágenes subidas nunca son accesibles.

### `wrangler.toml` sin bindings documentados

El archivo existe pero los bindings de D1, KV, R2 y Queue deben estar declarados. Sin el `.dev.vars` correctamente configurado el dev local no funciona.

### Club-site sin implementar

`packages/club-site` tiene la estructura pero **el src está vacío**. La landing pública del club (mencionada en ARCHITECTURE.md) no existe.

---

## 6. Lógica de negocio faltante

| Feature | Estado | Impacto |
|---|---|---|
| Motor de precios por slot | No implementado | Los créditos siempre cuestan `1` — la tabla `credit_prices` nunca se consulta |
| Política de cancelación | UI existe (`CancellationPolicyPage`), backend no | Sin reglas de cuántas horas antes se puede cancelar ni si se devuelven créditos |
| Reset mensual de créditos | No existe | `creditAllocationMonthly` nunca se aplica — los socios no reciben su cuota mensual |
| Generación de facturas | No existe | `invoices` nunca se popula — el billing siempre está vacío |
| Onboarding de nuevo club | No existe | No hay wizard para configurar un club nuevo end-to-end |

---

## Priorización de fixes

### Fase 1 — Habilitar operación real (2–3 semanas)

1. API client en el frontend (base URL, JWT headers, error handling)
2. Conectar LoginPage al backend real
3. Implementar motor de créditos (`credit_prices` lookup)
4. Fix cancelación con refund de créditos
5. Fix overlap check en bookings
6. Fix availability con court blocks
7. Consumer Worker para Queue (email confirmación)
8. Migrations + seed data

### Fase 2 — Completar el producto (3–4 semanas)

9. Rutas faltantes (credit-prices, credit-sales, court-blocks, agenda)
10. Conectar todas las páginas del frontend al API
11. Cron Trigger para reset mensual de créditos
12. Generación automática de invoices (fin de mes)
13. Política de cancelación con reglas configurables
14. Password reset completo (tabla + endpoints + email)

### Fase 3 — Producción (1–2 semanas)

15. Fix seguridad (PBKDF2, rate limiting, CORS whitelist)
16. R2 serving endpoint
17. Club-site (landing pública)
18. Onboarding wizard de nuevo club
19. Monitoreo + alertas

---

*Análisis generado: marzo 2026 · CanchaPro*
