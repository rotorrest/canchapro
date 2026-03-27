# Ica Padel Club — Roadmap a Producción

## Contexto

Análisis basado en investigación competitiva de 13+ plataformas de gestión de canchas de pádel (Playtomic, ATC Sports, EasyCancha, PadelOS, Anolla, etc.) y el estado actual de la demo MVP.

**Mercado objetivo:** Clubs de pádel en Perú (y LATAM).
**Modelo:** SaaS flat-fee, zero comisión, $50–$150/mes.

---

## Bloque 1 — Sin esto no se puede vender (P0)

| Módulo | Estado actual | Qué falta |
|---|---|---|
| Backend real | No existe | Django/DRF o Node, PostgreSQL, auth JWT real |
| Auth real | Mock | Login email+password, reset password, sesiones |
| Persistencia | In-memory | Base de datos, migraciones, seeds |
| Pagos locales | No existe | Yape/Plin webhook, POS, registro de efectivo |
| Notificaciones | No existe | Email transaccional (confirmación reserva, bienvenida) |
| Multi-tenancy | No existe | Cada club es un tenant aislado con su data |
| Deploy | No existe | Hosting, dominio, SSL, CI/CD |

---

## Bloque 2 — Sin esto no compite (P1)

| Módulo | Estado actual | Qué falta |
|---|---|---|
| WhatsApp | No existe | Confirmación de reserva por WA, recordatorios |
| PWA mobile | Parcial | Manifest, service worker, install prompt, offline básico |
| Onboarding del club | No existe | Wizard: crear club → canchas → horarios → primer admin |
| Landing/marketing | No existe | Página pública del club con info, precios, ubicación |
| Facturación electrónica | No existe | SUNAT para Perú (boletas/facturas) |
| Reportes exportables | No existe | CSV/PDF de reservas, créditos, miembros |

---

## Bloque 3 — Diferenciadores que venden (P2)

| Módulo | Detalle |
|---|---|
| Split payment x4 | Dividir costo de cancha entre 4 jugadores |
| Torneos | Formato americano, mexicano, brackets |
| Matchmaking | "Busco 4to" con nivel y disponibilidad |
| White-label | Logo, colores, dominio custom por club |
| Coach management | Horarios de coaches, comisiones, reserva de clases |
| Marketing automation | "No juegas hace 2 semanas", cumpleaños, bienvenida |

---

## Bloque 4 — Escala (P3)

| Módulo | Detalle |
|---|---|
| Multi-sede | Dashboard consolidado para cadenas de clubs |
| IoT | Control de luces y acceso automático por reserva |
| API pública | Para integraciones de terceros |
| Alquiler de equipos | Paletas, pelotas, zapatillas — tracking y cobro |
| App nativa | React Native para iOS/Android (push notifications) |

---

## Estimación de esfuerzo P0 + P1

| Componente | Semanas (1 dev senior) |
|---|---|
| Backend + DB + Auth | 3–4 |
| Multi-tenancy | 1–2 |
| Conectar frontend al backend | 2 |
| Pagos (Yape/Plin/POS/efectivo) | 2–3 |
| WhatsApp (API Business) | 1–2 |
| Email transaccional | 1 |
| PWA + offline | 1 |
| Onboarding wizard | 1 |
| Landing pública por club | 1 |
| Deploy + infra | 1 |
| **Total P0 + P1** | **~14–18 semanas** |

Con 2 devs en paralelo (backend + frontend): **8–10 semanas** hasta un MVP vendible.

---

## Análisis competitivo resumido

### Competencia directa

| Competidor | Precio/mes | Modelo | Mercado | Debilidad |
|---|---|---|---|---|
| Playtomic | $59–$820 + comisión | Marketplace + SaaS | Global | Comisiones altas, dependencia del marketplace |
| ATC Sports | $40 | Flat fee | LATAM (14 países) | Genérico (fútbol primero), no padel-first |
| EasyCancha | Comisión | Marketplace | LATAM (750+ clubs) | Marketplace, no herramienta de gestión |
| Turnito | Gratis/freemium | Flat fee | Argentina/Chile | Básico, sin features de pádel |
| PadelOS | No público | White-label | Europa | Sin presencia LATAM |
| Anolla | Freemium + add-ons | Per-court | Europa | Sin pagos LATAM |

### Oportunidad

El cuadrante **"padel-específico + nativo LATAM"** está vacío. Ninguna plataforma combina:

- Features específicas de pádel (matchmaking, torneos, split x4)
- Pagos nativos LATAM (Yape, Plin, MercadoPago, efectivo)
- WhatsApp-first (así operan los clubs hoy)
- Zero comisión (flat fee)
- Facturación electrónica local (SUNAT)

### Mercado

- 77,300 canchas globalmente, +15% anual
- 35M+ jugadores, proyectado 70M en 2030
- Perú: mercado emergente, adopción digital mínima — timing ideal para entrar
- Un club nuevo se abre cada 2.5 horas en el mundo

---

*Generado: Marzo 2026 · Lumini · lumini.dev*
