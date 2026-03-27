# Propuesta: Gestión de Planes y Add-ons en Platform Admin

> Fecha: marzo 2026

---

## 1. Gestor de Planes y Add-ons

### Estructura de navegación

El `PlatformPage` actual tiene todo en una sola vista. Se convierte en **3 tabs**:

```
[Clubes]   [Planes y Precios]   [Add-ons]
```

---

### Tab: Planes y Precios

**Vista de planes** — tres cards editables (Starter / Pro / Business):

| Campo | Qué hace |
|---|---|
| Precio base mensual | Fee fijo que paga el club |
| Fee por reserva (S/.) | Precio unitario sobre reservas completadas |
| Reservas gratuitas incluidas | Cuántas no se cobran por mes |
| Límite de canchas | `null` = ilimitado |
| Límite de socios | `null` = ilimitado |
| Features incluidas | Checkbox list de qué viene "de base" |
| Fecha efectiva | Cambios entran en vigencia desde esa fecha (no retroactivo) |

Cada plan tiene un **historial de versiones** usando los `rateCards` ya en el schema: se puede ver qué costaba en marzo, qué va a costar en abril. Ya está modelado en DB — solo falta la UI.

**Flujo para cambiar precios:**
1. Click "Editar" en un plan → modal con los campos actuales
2. Se cambia precio + se pone fecha de vigencia
3. Se crea nueva versión del rate card (no se borra la anterior)
4. El mes actual sigue facturando con el precio anterior; el mes nuevo usa el nuevo

---

### Tab: Add-ons

Catálogo de módulos opcionales. Cada add-on tiene:

| Campo | Descripción |
|---|---|
| Nombre + descripción | Lo que ve el club admin en su panel de billing |
| Tipo de precio | `flat_monthly` (fijo/mes) · `per_unit` (por evento/mensaje) · `percentage` (% sobre base) |
| Precio | Con historial igual que los planes |
| Plans que pueden contratarlo | Ej: "WhatsApp solo disponible en Pro y Business" |
| Estado | `active` / `beta` / `deprecated` |

**Vista principal:** tabla de add-ons con columna de cuántos tenants lo tienen activo.

**Asignación a un tenant:** desde el detalle del club (expandir una fila de la tabla de Clubes), sección "Add-ons activos" con toggle por add-on + precio efectivo (puede ser override del precio base).

**En la factura:** cada add-on activo aparece como línea de ítem separada. El schema de `invoices` ya existe — se agrega un campo `addOnLineItems: json`.

---

## 2. Add-ons recomendados

### Tier A — Alta tracción, fácil de vender

#### WhatsApp Recordatorios `included` en Pro y Business
- Envía automáticamente: _"Hola Miguel, tu reserva en Cancha 2 es hoy a las 6pm. ¡Nos vemos!"_
- Reduce no-shows → el club mejora ocupación real
- Integración: Meta Business API o Twilio
- **Incluido en planes Pro y Business** (no disponible como add-on para Starter)
- Costo operativo absorbido: ~$0.0085 USD/conversación (utility message, Meta API)
- Funciona como diferenciador clave para upgrade de Starter → Pro

#### Link de Pago para Créditos `flat_monthly`
- El staff genera un link (Culqi / Yape / Plin) y lo manda por WhatsApp al socio
- El socio paga → los créditos se acreditan automáticamente en su balance
- No requiere que el socio entre al app para comprar créditos
- **Precio sugerido: S/ 29/mes + 1.5% sobre transacción (o solo flat)**

---

### Tier B — Diferenciador fuerte en el mercado LATAM

#### Pagos Integrados (in-app) `percentage` sobre transacciones
- Socio compra créditos directo desde la app sin salir
- Integración con Culqi (Perú) o Mercado Pago (regional)
- El club puede fijar precio a los créditos y cobrarle al socio desde la app
- **Precio sugerido: 2–3% sobre cada transacción de créditos**

#### Multi-sede `flat_monthly`
- Un tenant maneja 2+ ubicaciones físicas con canchas separadas, reportes consolidados y portal unificado
- La DB ya soporta esto (courts tienen `tenantId`, no sede) — se agrega tabla `locations`
- **Precio sugerido: S/ 49/sede adicional/mes**

---

### Tier C — Marketing del club hacia sus socios

#### Módulo de Comunicaciones (Email + Push) `flat_monthly`
- El admin del club redacta y manda emails/notificaciones a sus socios
- Casos de uso: "Inscríbete al torneo del sábado", "Nuevo horario de Cancha 3", "Tenemos paletas en venta"
- Integración: Resend o Postmark para email; FCM para push (requiere app mobile)
- **Precio sugerido: S/ 49/mes (hasta 2,000 envíos)**

#### Módulo de Publicidad Interna `flat_monthly`
- Banners/cards que aparecen en la pantalla de booking del socio
- El club admin sube imagen + texto + fechas de vigencia
- Casos de uso: clases, torneos, promociones de equipamiento
- **Precio sugerido: S/ 29/mes**

---

### Tier D — Futuro / mayor complejidad

#### Módulo de Torneos
- Crear bracket, inscripción de socios, seguimiento de resultados
- Alto valor percibido, alta complejidad de desarrollo

#### Referidos
- El socio genera un link → amigo se registra → ambos reciben créditos
- Muy efectivo para crecimiento orgánico del club

#### Integración de Acceso QR
- El QR del socio (ya existe `/my-qr`) se valida en un lector físico en la cancha
- Requiere hardware partner o app de torniquete

---

## 3. Priorización de implementación

```
Sprint 1 │ Plan & Add-on manager (UI plataforma)
Sprint 2 │ WhatsApp Recordatorios
Sprint 2 │ Link de Pago (Culqi)
Sprint 3 │ Pagos Integrados
Sprint 3 │ Multi-sede
Sprint 4 │ Email/Push marketing
```

---

## 4. Cambios en schema necesarios

```ts
// Nuevo: catálogo de add-ons
addOns: {
  id, name, description,
  priceType: "flat_monthly" | "per_unit" | "percentage",
  price, effectiveFrom,
  availableOnPlans: json, // ["pro", "business"]
  status: "active" | "beta" | "deprecated",
}

// Nuevo: add-ons activos por tenant
tenantAddOns: {
  id, tenantId, addOnId,
  priceOverride,       // null = usa precio del catálogo
  activatedAt, cancelledAt,
}

// Modificar: invoices
invoices: {
  ...existing fields,
  addOnLineItems: json, // [{ addOnId, name, amount }]
}
```
