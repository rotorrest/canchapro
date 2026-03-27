# Benchmark: CanchaPro vs Competencia

> Fecha: marzo 2026

---

## 1. Competidores directos en LATAM

| | **Playtomic** | **ATC Sports** | **EasyCancha** | **CanchaPro** |
|---|---|---|---|---|
| **Precio desde** | $59/mes | $40/mes | Comision | Gratis + S/1/reserva |
| **Peru** | Parcial | Ya opera | Ya opera | Nativo |
| **Multi-deporte** | Solo raqueta | Si | Si | Si |
| **White-label** | No (marca Playtomic) | No confirmado | No | **Si** |
| **Marketplace jugadores** | Si (moat) | Si | Si (core) | No |
| **Sistema de creditos** | Plan Pro+ | Depositos | Suscripcion | **Si (core)** |
| **Add-ons/marketplace modulos** | No | No | No | **Si** |
| **Multi-sede** | Si | Si | N/A | **Si** |
| **Dominio personalizado** | No | No | No | **Si** |
| **WhatsApp** | No nativo | Si | No | Add-on |

## 2. Competidores en Europa (referencia)

| | **TPC Matchpoint** | **Padel iQ** | **Playbypoint** | **CanchaPro** |
|---|---|---|---|---|
| **White-label** | Si | Si | Si | **Si** |
| **App nativa branded** | Si | Si | Si | Roadmap |
| **Torneos** | Si | No | Si | Add-on |
| **Webshop** | No | Si | No | Roadmap |
| **Split payments** | No | Si | No | **Add-on** |
| **Heat maps/analytics** | No | Si | No | Roadmap |

---

## 3. Fichas por competidor

### Playtomic (playtomic.com)

- **Origen:** Espana (ex-Syltek). Funding: $70M. Revenue ~$15M (2024).
- **Alcance:** 63 paises, 6,700+ clubes, 25,000+ canchas, 4M+ usuarios.
- **Pricing:** Standard $59/mo, Professional $89/mo, Champion $139/mo, Master $279/mo.
- **Features clave:** Marketplace de jugadores (moat principal), matchmaking, ligas, torneos, clases, POS, wallet, CRM, pagos integrados (1.5M+ transacciones/mes).
- **Debilidad:** No white-label — clubes pierden identidad bajo marca Playtomic. Pricing alto para LATAM.

### ATC Sports / AlquilaTuCancha (atcsports.io)

- **Origen:** LATAM. Opera en 14 paises (incluyendo Peru).
- **Pricing:** Desde $40 USD/mes. 1 mes gratis.
- **Features clave:** Multi-deporte, integracion WhatsApp/Instagram/Facebook, pricing dinamico, depositos con cobro automatico no-show, productos/consumos (bar, pro shop).
- **Debilidad:** No tiene sistema de creditos, no white-label confirmado, sin marketplace de add-ons.

### EasyCancha (easycancha.com)

- **Origen:** Chile (2016). Presente en Peru.
- **Modelo:** Marketplace puro (B2C) — comision por reserva. No es SaaS de gestion.
- **Features clave:** Descubrimiento de canchas, comparacion de precios, multi-deporte.
- **Debilidad:** No es herramienta de gestion para el club. Solo agregador.

### TPC Matchpoint (tpcmatchpoint.com)

- **Origen:** Espana (2008). 20+ paises.
- **Features clave:** App branded personalizada (App Store/Google Play), website branded, matchmaking, torneos, academia, coach app, smart family accounts, control de acceso fisico, WhatsApp sharing.
- **Debilidad:** Pricing no publico (probablemente alto). No enfocado en LATAM.

### MATCHi (matchi.se)

- **Origen:** Suecia. 3,000+ venues. 10+ anos.
- **Features clave:** Hardware (kioscos de alquiler, control luces/acceso), split payments, open matches, MATCHi TV (streaming).
- **Debilidad:** Foco Escandinavia/Europa. Sin presencia LATAM.

### Padel iQ (padeliq.io)

- **Origen:** Dinamarca. 80,000+ usuarios.
- **Features clave:** White-label total, webshop, heat maps, comunicacion automatizada segmentada, Quick Match, website builder/CMS.
- **Debilidad:** Solo padel. Solo Europa (DK, UK).

### Playbypoint (playbypoint.com)

- **Origen:** Anti-Playtomic. Filosofia "own your club, own your community".
- **Features clave:** App y web branded, programas/clases/ligas, staff scheduling, mensajeria integrada.
- **Debilidad:** Sin marketplace. Pricing no publico.

### ReservaDeportes (reservadeportes.com)

- **Origen:** Espana. Sirve municipios, clubes, urbanizaciones.
- **Pricing:** Desde 20 EUR/mes (urbanizaciones), 30 EUR/mes (clubes), 50 EUR/mes (municipios).
- **Features clave:** Wallet/bono monedero, app personalizada, gestion de academia, automatizacion instalaciones.

### Otros mencionables

- **PadelCom** (padelcom.app) — Comunidad padel #1 LATAM. Social-first.
- **DondeJuego** (dondejuegoapp.com) — Marketplace LATAM, futbol-first.
- **Anolla** — Modular, AI scheduling, pricing dinamico. Free starter.
- **PadelOS** (padelos.co) — AI segmentacion, loyalty, video recording.
- **Sportrick** — Italiano, mas gym/fitness que padel.
- **Deporwin/T-Innova** — ERP completo (30+ anos), hardware, Espana.

---

## 4. Ventajas competitivas de CanchaPro

1. **Precio agresivo** — Freemium (Starter gratis + S/1/reserva) es el mas barato de LATAM. ATC cobra $40/mes fijo. Playtomic desde $59/mes.

2. **White-label total** — Playtomic (lider) NO ofrece white-label. CanchaPro da subdominio propio, dominio personalizado, colores, logo. Solo TPC y Padel iQ ofrecen esto en Europa, pero no existe en LATAM.

3. **Sistema de creditos** — Unico en LATAM con creditos pre-pagados + pricing dinamico por horario/dia. Competidores usan pago directo o depositos.

4. **Marketplace de add-ons** — Ningun competidor tiene esto. Modelo de revenue expansion: empezar barato, crecer con el club. Paquetes con descuento.

5. **Multi-deporte** — 12 deportes soportados. Playtomic solo raqueta. ATC es multi pero sin creditos.

6. **Infraestructura serverless** — Cloudflare Workers en edge = latencia baja en toda LATAM sin servidores regionales.

---

## 5. Gaps criticos para cerrar

| Gap | Prioridad | Quienes lo tienen | Estado |
|---|---|---|---|
| **Pasarela de pagos** (Culqi/Yape) | CRITICA | Playtomic, ATC, TPC | Pendiente |
| **App nativa o PWA** | ALTA | Todos excepto Reserva tu Padel | Pendiente |
| **WhatsApp nativo** | ALTA | ATC Sports | Add-on (pendiente implementar) |
| **Torneos y ligas** | MEDIA | Playtomic, TPC, MATCHi | Add-on (pendiente) |
| **Matchmaking / buscar jugador** | MEDIA | Playtomic, Padel iQ, OpenCourt | Roadmap |
| **Control acceso fisico** | BAJA | MATCHi, TPC, Deporwin | Add-on (roadmap) |
| **Clases/academia** | MEDIA | TPC, Playtomic Champion | Add-on (roadmap) |
| **Rankings/niveles** | BAJA | Playtomic, TPC, Padel iQ | Roadmap |
| **Marketplace de jugadores** | BAJA (MVP) | Playtomic (moat), ATC, EasyCancha | No planeado |

---

## 6. Veredicto

CanchaPro tiene lo suficiente para **lanzar y competir en LATAM**, especialmente contra ATC Sports y EasyCancha. Las ventajas claras son: precio, white-label, creditos, y marketplace de add-ons.

**3 gaps criticos antes de escalar:**

1. **Pasarela de pagos** (Culqi/Yape para Peru) — sin esto los creditos son manuales
2. **App nativa** o PWA optimizada — todos los competidores tienen app
3. **WhatsApp integrado** — canal #1 en LATAM, ATC ya lo tiene

El marketplace de jugadores (estilo Playtomic) es un moat dificil de replicar pero **no necesario para el MVP**. CanchaPro es B2B (vender al club), no B2C (atraer jugadores). Los clubes ya tienen sus socios.

---

## Fuentes

- Playtomic: playtomic.com/pricing, Global Padel Report 2025
- ATC Sports: atcsports.io
- EasyCancha: easycancha.com, Harvard Digital Innovation case
- TPC Matchpoint: tpcmatchpoint.com
- MATCHi: matchi.se, playmore.matchi.com
- Padel iQ: padeliq.io
- Playbypoint: playbypoint.com
- ReservaDeportes: reservadeportes.com
- Reserva tu Padel: reservatupadel.es
- Deporwin: t-innova.com
- Anolla: anolla.com
- PadelOS: padelos.co
- Gitnux: Top 10 Padel Booking Software 2026
- StockPadel: Best Software for Managing Padel Courts
- Padel Magazine: Essential Software for Club Management
