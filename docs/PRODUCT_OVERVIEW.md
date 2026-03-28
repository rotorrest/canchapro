# CanchaPro — Descripción de Producto

> Documento de producto para alineamiento interno y conversaciones de inversión.
> Marzo 2026

---

## Qué es CanchaPro

CanchaPro es un **sistema operativo para clubes deportivos**. Un SaaS white-label que reemplaza el WhatsApp, la hoja de Excel y la caja manual con una plataforma completa: reservas, cobros, socios, reportes, sitio web y comunicaciones — todo bajo la marca del club.

No somos un marketplace de canchas. No competimos por el jugador. **Nuestro cliente es el dueño del club**. Le damos las herramientas para que opere mejor, cobre más rápido y llene más canchas.

---

## El problema

Los clubes deportivos en LATAM operan así:

1. **Reservas por WhatsApp.** El admin recibe 50 mensajes al día, confirma a mano, se equivoca, doble-bookea.
2. **Cobros informales.** Yape, transferencia, efectivo. Sin trazabilidad. Sin conciliación. El staff no sabe quién pagó.
3. **Socios en una hoja de cálculo.** O en la cabeza del admin. Sin historial, sin créditos, sin comunicación estructurada.
4. **Cero presencia digital.** No tienen página web. Su "marketing" es un post en Instagram cada 3 semanas.
5. **No-shows sin consecuencia.** 10-15% de las reservas no aparecen. La cancha queda vacía, el ingreso se pierde.

Los competidores que existen son genéricos (ATC Sports), cobran comisión (Playtomic, EasyCancha), o no operan en LATAM (Padel iQ, TPC Matchpoint). Ninguno combina pagos locales, WhatsApp nativo, white-label y cero comisión.

---

## Los productos

CanchaPro tiene **4 productos** que funcionan juntos:

### 1. Panel de Gestión (SaaS core)

La aplicación web que usa el dueño del club, su staff y sus socios. Cada club tiene su propio panel bajo su marca.

**Para el dueño del club (admin):**
- Dashboard con KPIs en tiempo real (ocupación, ingresos, socios activos)
- Gestión de canchas con versionado (historial de cambios, superficie, tipo, multiplicador de precio)
- Gestión de socios: perfil, balance de créditos, historial de transacciones, comentarios internos
- Reservas: agenda visual, vista de calendario, filtros por cancha/sede/status
- Motor de créditos: precios dinámicos por horario (mañana/tarde/noche) × tipo de día (semana/fin de semana)
- Reportes: ocupación, ingresos, créditos vendidos, exportables a CSV
- Configuración: marca (logo, colores), política de cancelación, gestión de sedes

**Para el staff:**
- Vista operativa: canchas, reservas, socios, créditos
- Check-in por QR: escaneo rápido desde el celular
- Venta de créditos: registro de pagos en efectivo, Yape, Plin, POS

**Para el socio (miembro):**
- Reservar cancha: selección visual de horario disponible, deducción automática de créditos
- Mis reservas: historial, cancelación
- Mi saldo: balance de créditos, historial de transacciones
- Mi QR: código de acceso para check-in

**Multi-tenant:** Cada club es un tenant aislado. Un solo despliegue sirve a todos. Los datos nunca se mezclan.

**Multi-sede:** Clubs con 2+ ubicaciones operan desde un solo panel. Canchas separadas por sede, reportes consolidados, selector de sede en el sidebar.

---

### 2. Marketplace de Módulos

Un catálogo de módulos opcionales que el club activa desde su panel. Se cobran como add-ons sobre el fee mensual.

Organizado en 3 categorías por valor:

**Módulos de alto ROI** — impacto directo en ingresos
| Módulo | Qué hace | Precio |
|---|---|---|
| WhatsApp Recordatorios | Reminder automático 2h antes. Reduce no-shows ~30% | Incluido en Pro+ |
| Lista de Espera | Cancelación → el primero en lista recibe WhatsApp. Rellena 60-80% de cancellaciones | S/ 29/mes |
| Link de Pago | Genera link Yape/Plin/Culqi, socio paga, créditos se acreditan solos | S/ 29/mes |
| Split de Cancha | El que reserva comparte un link, cada jugador paga su parte | S/ 29/mes |

**Módulos de operación** — eficiencia del club
| Módulo | Qué hace | Precio |
|---|---|---|
| Pagos In-App | Socios compran créditos desde la app con Culqi/MercadoPago | 2% por transacción |
| Clases y Coaches | Horarios de coaches, reserva de clases, comisiones automáticas | S/ 89/mes |
| Multi-sede | 2+ ubicaciones en un solo panel | S/ 49/sede adicional |
| RFID | Tarjetas de acceso con logo del club. Celular como lector | S/ 150/mes + tarjetas |
| Dominio Personalizado | app.tuclub.pe en lugar de tuclub.canchapro.com | S/ 29/mes |
| Reportes SUNAT | Boletas y facturas electrónicas automáticas | S/ 49/mes |

**Módulos de engagement** — retención y crecimiento
| Módulo | Qué hace | Precio |
|---|---|---|
| Busco Jugador | "Busco 4to para el sábado". Matchmaking interno | S/ 39/mes |
| Ranking de Socios | ELO interno. Nadie deja un club donde está en el top 10 | S/ 29/mes |
| Fidelización | Puntos por reserva, canjeables por créditos. "La 11va es gratis" | S/ 49/mes |
| Referidos | Socio comparte link, amigo se registra, ambos reciben créditos | S/ 29/mes |
| Comunicaciones | Email + push masivo a socios. Incluye banners en la app | S/ 49/mes |
| Torneos | Brackets, inscripciones, resultados en tiempo real | S/ 79/mes |

**Paquetes con descuento:**
| Bundle | Incluye | Precio | Ahorro |
|---|---|---|---|
| Ocupación Máxima | WhatsApp + Lista de espera | S/ 79/mes | S/ 19 |
| Cobros Sin Fricción | Link de pago + Split | S/ 49/mes | S/ 9 |
| Comunidad Activa | Matchmaking + Ranking + Referidos | S/ 79/mes | S/ 18 |
| Academia | Clases + Torneos | S/ 149/mes | S/ 19 |

Cada módulo activado tiene su **panel de configuración** dedicado (plantillas de WhatsApp, reglas de lista de espera, datos fiscales SUNAT, incentivos de referidos, etc.).

---

### 3. Sitio Web del Club (Site Builder)

Cada club tiene su propio sitio web público, publicado en `slug.canchapro.com` o en su dominio personalizado.

**No es un template fijo.** Es un builder de secciones tipo Wix simplificado:

- El admin elige de una librería de **17 tipos de secciones**: Hero, Sobre nosotros, Canchas, Galería, Precios, Horarios, Equipo, Testimonios, Contacto, FAQ, CTA, Instagram, Ubicación, y más
- Reordena las secciones como quiera
- Edita contenido de cada sección (textos, imágenes, colores)
- Las secciones de Canchas, Horarios y Precios se **populan automáticamente** con datos reales del club — zero mantenimiento manual
- Publica con un clic

**Arquitectura de rendimiento:**
- HTML pre-renderizado al publicar, servido desde edge cache (TTFB ~10ms)
- SEO completo: meta tags editables, structured data automático, sitemap
- Mobile-first, Core Web Vitals optimizados

**Templates iniciales:**
- Club básico (5 secciones, para clubes nuevos)
- Club profesional (9 secciones, para clubes con academia)
- Centro deportivo (11 secciones, para centros multi-deporte)

**Disponibilidad:** Builder incluido en Pro. Multi-página y dominio custom en Business.

---

### 4. Panel de Plataforma (Lumini internal)

El panel que usa nuestro equipo (Lumini) para administrar el SaaS:

- **Clubes:** lista de todos los tenants, KPIs por club, impersonación (entrar como admin de cualquier club para debug/soporte)
- **Facturación:** estado de cobro de todos los clubs. Pendiente → Facturado → Pagado
- **Onboarding:** wizard para dar de alta un nuevo club
- **Tickets:** sistema de soporte con kanban y mensajes
- **Rate cards:** gestión de tarifarios con versionado (cambiar precios para nuevos clubs sin afectar existentes)
- **Métricas de plataforma:** MRR, clubes activos, reservas totales, churn

---

## Cómo es white-label

Cuando un club se registra en CanchaPro, no ve "CanchaPro" en ningún lado de su operación diaria:

| Touchpoint | Qué ve el club | Qué ve el socio del club |
|---|---|---|
| URL del panel | `icapadel.canchapro.com` (o `app.icapadelclub.pe`) | Idem |
| Sidebar y header | Logo y nombre del club | Logo y nombre del club |
| Colores | Primario y accent del club | Primario y accent del club |
| Sitio web público | Sitio con la marca del club | Sitio con la marca del club |
| WhatsApp | Mensaje desde el número del club | Mensaje desde el número del club |
| Emails | Remitente configurado por el club | Nombre del club |
| QR de acceso | Nombre del club | Nombre del club |
| Tarjetas RFID | Diseño provisto por el club | Logo del club |

La única referencia a CanchaPro es "Powered by CanchaPro" en el footer del sitio web público (removible en plan Business).

---

## Modelo de negocio

### Ingresos recurrentes (3 fuentes)

```
MRR = Plan base + Add-ons + Revenue share
```

**1. Plan base** (fee fijo mensual)

| Plan | Precio | Para quién |
|---|---|---|
| Starter | Gratis | Clubs nuevos, 1-2 canchas. Convierte a Pro cuando crece |
| Pro | S/ 79/mes | Clubs medianos, 3-9 canchas. El sweet spot |
| Business | S/ 149/mes | Clubs grandes, 10+ canchas o multi-sede |

**2. Fee por reserva** (variable, escala con uso)

| Plan | Fee/reserva |
|---|---|
| Starter | S/ 1.00 (150 gratis/mes) |
| Pro | S/ 0.80 |
| Business | S/ 0.50 |

El fee baja al subir de plan — incentivo real para upgrade. Ningún club paga más del 0.5% de su ingreso.

**3. Add-ons** (fee fijo mensual o porcentaje)
- Promedio esperado: S/ 50-100/mes por club activo
- Attach rate proyectado: 60% de clubs Pro/Business activan al menos 1 add-on

### Unit economics

| Métrica | Starter | Pro | Business |
|---|---|---|---|
| Ingreso mensual promedio | S/ 25 | S/ 324 | S/ 549 |
| Costo infra por club | S/ 5 | S/ 15 | S/ 25 |
| **Profit por club** | **S/ 20** | **S/ 309** | **S/ 524** |
| **Margen** | **80%** | **95%** | **95%** |

Con add-ons, el ARPU de un club Pro sube de S/ 324 a ~S/ 420/mes.

### Break-even

- **Costos fijos:** S/ 7,350/mes (1 dev senior + infra + herramientas)
- **Break-even:** ~27 clubs (~16 pagando)
- **Payback period:** 21 meses
- **Inversión total hasta break-even:** ~S/ 35,000

---

## Mercado

### TAM — El mercado de software para clubs deportivos

- 77,300 canchas de pádel globalmente, creciendo +15% anual
- 35M+ jugadores activos, proyectados a 70M en 2030
- Un club nuevo se abre cada 2.5 horas en el mundo

### SAM — LATAM

- Perú: 150+ clubs de pádel, creciendo ~30% anual
- Colombia, Chile, México, Argentina: mercados emergentes en pádel
- Adopción digital mínima en la región — la mayoría opera por WhatsApp y Excel

### SOM — Perú (año 1-2)

- Target: 50 clubs en 18 meses
- Venta directa (el fundador visita clubs)
- CAC estimado: S/ 200 por club (bajo: el producto se demuestra en 15 minutos)

### Expansión

CanchaPro no es solo pádel. El sistema soporta **cualquier deporte de cancha**: tenis, fútbol, squash, pickleball, vóley, básquet, natación. El schema ya tiene un campo `sport` multi-deporte.

LATAM tiene 1,000+ clubs que podrían usar CanchaPro. El pipeline natural: Perú → Colombia → Chile → México → Argentina.

---

## Posicionamiento competitivo

```
                    White-label
                        ↑
                        │
        CanchaPro ●     │     ● TPC Matchpoint
                        │     ● Padel iQ
                        │
  ──────────────────────┼──────────────────── Comisión 0%
                        │
                        │
        ATC Sports ●    │     ● Playtomic ($70M funding)
                        │     ● EasyCancha
                        │
                        │
                    Marketplace
```

| Dimensión | Playtomic | ATC Sports | EasyCancha | CanchaPro |
|---|---|---|---|---|
| Modelo | Marketplace + SaaS | Flat fee | Comisión | **Flat fee + add-ons** |
| Comisión al club | Si (por jugador) | No | Si | **No** |
| White-label | No | No | No | **Si** |
| Pagos LATAM (Yape/Plin) | No | No | No | **Si** |
| WhatsApp nativo | No | No | No | **Si** |
| Website builder | No | No | No | **Si** |
| Add-on marketplace | No | No | No | **Si** |
| Presencia LATAM | Limitada | 14 países | 750 clubs | **Nuevo entrante** |
| Pricing | Desde $59/mes | $40/mes | Comisión variable | **Gratis (Starter)** |

**El cuadrante "white-label + nativo LATAM" está vacío.** CanchaPro es el primero en ocuparlo.

### Moat

1. **Efecto red del marketplace de módulos:** más clubs → más módulos desarrollados → más valor → más clubs
2. **Switching cost del site builder:** el club invierte horas en su sitio web → no se va fácil
3. **Data network effect:** datos de ocupación, precios y demanda de todos los clubs permiten optimizar pricing y matchmaking cross-club
4. **Integración profunda con pagos LATAM:** Yape, Plin, Culqi, MercadoPago son integraciones que un competidor europeo o americano no va a hacer

---

## Stack tecnológico

| Capa | Tech | Por qué |
|---|---|---|
| Backend | Hono (TypeScript) en Cloudflare Workers | Edge computing, <50ms latency, auto-scale |
| Base de datos | Cloudflare D1 (SQLite) | Shared multi-tenant, 5M rows free/day |
| Cache | Cloudflare KV | Config y sitios pre-renderizados |
| Storage | Cloudflare R2 | Imágenes, logos, documentos |
| Async jobs | Cloudflare Queues | Notificaciones, webhooks, invoicing |
| Frontend | React SPA (Vite) + Tailwind + shadcn/ui | Monorepo, Turborepo, pnpm |
| Auth | JWT con Web Crypto API | Zero dependencias externas |
| Pagos | Culqi, Yape API, MercadoPago | Nativos LATAM |
| Mensajería | Meta Business API (WhatsApp), Resend (email) | Costo variable bajo |

**Costo de infra a escala:**

| Clubs | Costo infra/mes | Revenue/mes | Margen infra |
|---|---|---|---|
| 10 | ~$25 | ~S/ 2,500 | 99% |
| 50 | ~$165 | ~S/ 15,000 | 99% |
| 200 | ~$585 | ~S/ 60,000 | 99% |

---

## Estado actual (marzo 2026)

### Lo que está construido
- Panel de gestión completo: 30+ páginas, todos los flujos de admin/staff/socio
- Multi-tenancy con impersonación (platform admin puede "entrar" como cualquier club)
- Schema de base de datos completo con 15+ tablas
- Marketplace de 16 add-ons con bundles y configuración por módulo
- Signup wizard de 7 pasos para onboarding de clubes nuevos
- Arquitectura multi-sede funcional
- Sistema de créditos con precios dinámicos
- Site builder (PRD completo, infraestructura lista)

### Lo que falta para producción
- Conectar frontend al API real (8-10 semanas)
- Consumer de Queue para WhatsApp/email
- Integración de pagos (Culqi/Yape)
- PWA (manifest, service worker, offline básico)

---

## Por qué ahora

1. **El pádel en LATAM está en punto de inflexión.** Creció 30% en 2025 solo en Perú. Los clubs nuevos buscan software desde el día 1.
2. **No hay competidor nativo.** Playtomic no hace white-label. ATC es genérico. Nadie combina pagos locales + WhatsApp.
3. **El costo de construir es mínimo.** Cloudflare + edge computing + 1 dev senior = MVP en 10 semanas. No se necesita infra enterprise.
4. **El modelo de add-ons es compounding.** Cada módulo nuevo aumenta el ARPU de TODOS los clubs existentes sin re-vender.

---

*CanchaPro — El sistema operativo para clubes deportivos de LATAM.*
*Hecho por Lumini · lumini.dev*
