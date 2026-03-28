# PRD: Club Site Builder

> v1.0 — Marzo 2026

---

## 1. Resumen ejecutivo

Módulo de construcción de sitio web para clubes deportivos. Cada club arma su página pública usando una **librería de secciones prediseñadas** (tipo Lego/Wix simplificado). El resultado se publica en `slug.canchapro.com` o en el dominio propio del club. SEO-friendly, mobile-first, editable sin código.

**Problema:** Los clubes necesitan presencia web pero no tienen diseñador ni presupuesto para una agencia. Hoy tienen un template fijo con 3 campos. Los competidores (Padel iQ, TPC Matchpoint) ya ofrecen website builder/CMS.

**Solución:** Un builder de secciones que el admin del club opera desde su panel CanchaPro. Elige secciones, edita contenido, reordena, publica. Todo sin salir del panel de administración.

**Impacto esperado:**
- Diferenciador vs. Playtomic/ATC (no tienen builder)
- +S/ 39–49/mes de ARPU por club activo
- Reduce churn: el club tiene más invertido en la plataforma

---

## 2. Usuarios y roles

| Actor | Qué hace |
|---|---|
| **Club admin** (`super_admin`) | Construye y edita el sitio: elige secciones, edita contenido, publica |
| **Staff** | Puede editar contenido de secciones existentes (no puede agregar/eliminar secciones ni cambiar estructura) |
| **Visitante** (público) | Ve el sitio publicado en `slug.canchapro.com` o dominio custom |
| **Platform admin** | Ve métricas de uso del builder, puede desactivar sitios que violen ToS |

---

## 3. Librería de secciones

Cada sección es un bloque con:
- **Tipo** (identifica qué componente se renderiza)
- **Contenido** (campos editables: textos, imágenes, links)
- **Configuración visual** (color de fondo, variante de layout)
- **Orden** (posición en la página)
- **Visibilidad** (visible / oculta)

### Secciones disponibles (v1)

| ID | Sección | Campos editables | Variantes |
|---|---|---|---|
| `hero` | **Hero** | Título, subtítulo, imagen de fondo, CTA texto + link | Centrado, izquierda, con video bg |
| `about` | **Sobre nosotros** | Título, párrafo, imagen lateral | Imagen izquierda, imagen derecha |
| `sports` | **Nuestros deportes** | Lista de deportes con icono + nombre + descripción corta | Grid 2 cols, grid 3 cols |
| `courts` | **Nuestras canchas** | Automático: lee las canchas del club desde la DB | Cards, lista |
| `pricing` | **Precios** | Título, descripción, tabla de precios (slot × día) | Tabla, cards por horario |
| `schedule` | **Horarios** | Automático: lee horarios de las canchas | Tabla, pills por día |
| `gallery` | **Galería** | Múltiples imágenes (hasta 12) | Grid 2 cols, grid 3 cols, masonry |
| `testimonials` | **Testimonios** | Lista: nombre, texto, foto, rating | Cards, carousel |
| `team` | **Equipo / Coaches** | Lista: nombre, rol, foto, bio corta | Grid, lista |
| `location` | **Ubicación** | Dirección, embed de Google Maps, instrucciones de cómo llegar | Mapa + texto, solo mapa |
| `contact` | **Contacto** | Teléfono, email, WhatsApp, Instagram, Facebook, formulario toggle | Con formulario, solo info |
| `cta` | **Call to Action** | Título, subtítulo, botón texto + link, color de fondo | Centrado, con imagen |
| `faq` | **Preguntas frecuentes** | Lista: pregunta + respuesta (accordion) | Accordion, dos columnas |
| `hours` | **Horarios de atención** | Texto libre o auto desde config | Texto, tabla por día |
| `instagram` | **Feed Instagram** | Handle de Instagram, cantidad de posts | Grid 3×2, grid 4×1 |
| `custom_html` | **HTML personalizado** | Bloque de HTML libre (para embeds, iframes, widgets) | — |
| `spacer` | **Espaciador** | Altura en px | — |
| `divider` | **Divisor** | Estilo: línea, ondas, diagonal | 5 estilos |

### Secciones automáticas (leen datos reales del club)

Las secciones `courts`, `schedule`, y `pricing` se populan automáticamente con datos reales del club (canchas activas, horarios configurados, precios de créditos). El admin solo elige la variante visual y un título opcional.

---

## 4. Modelo de datos

### 4.1 Schema de página

```ts
// Nueva tabla: site_pages
sitePages = sqliteTable("site_pages", {
  id:        text("id").primaryKey(),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id),
  slug:      text("slug").notNull().default("home"),    // "home", "about", "pricing"
  title:     text("title").notNull(),                    // meta title
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  sections:  text("sections").notNull().default("[]"),   // JSON: SiteSection[]
  seoTitle:       text("seo_title").default(""),
  seoDescription: text("seo_description").default(""),
  seoImage:       text("seo_image").default(""),         // OG image URL
  updatedAt: text("updated_at"),
  createdAt: timestamp(),
}, (t) => ({
  tenantSlugIdx: uniqueIndex("idx_site_pages_tenant_slug").on(t.tenantId, t.slug),
}));
```

### 4.2 Estructura JSON de secciones

```ts
interface SiteSection {
  id: string;           // UUID
  type: SectionType;    // "hero" | "about" | "gallery" | ...
  order: number;        // posición en la página
  visible: boolean;     // visible u oculta
  variant: string;      // "centered" | "left" | "grid-2" | ...
  content: Record<string, unknown>;  // campos específicos por tipo
  style: {
    bgColor?: string;      // hex o preset ("white", "gray", "brand")
    textColor?: string;    // "light" | "dark" (auto-detect by default)
    paddingY?: "sm" | "md" | "lg" | "xl";
  };
}
```

### 4.3 Ejemplo: secciones de un sitio real

```json
[
  {
    "id": "s1",
    "type": "hero",
    "order": 0,
    "visible": true,
    "variant": "centered",
    "content": {
      "title": "Bienvenido a Ica Padel Club",
      "subtitle": "Las mejores canchas de pádel en Ica",
      "backgroundImage": "r2://tenants/ica-padel/hero.jpg",
      "ctaText": "Reservar cancha",
      "ctaLink": "https://icapadel.canchapro.com"
    },
    "style": { "bgColor": "brand", "paddingY": "xl" }
  },
  {
    "id": "s2",
    "type": "about",
    "order": 1,
    "visible": true,
    "variant": "image-right",
    "content": {
      "title": "Sobre nosotros",
      "text": "Somos el primer club de pádel en Ica...",
      "image": "r2://tenants/ica-padel/about.jpg"
    },
    "style": { "bgColor": "white", "paddingY": "lg" }
  },
  {
    "id": "s3",
    "type": "courts",
    "order": 2,
    "visible": true,
    "variant": "cards",
    "content": { "title": "Nuestras canchas" },
    "style": { "bgColor": "gray", "paddingY": "lg" }
  },
  {
    "id": "s4",
    "type": "gallery",
    "order": 3,
    "visible": true,
    "variant": "grid-3",
    "content": {
      "images": ["r2://tenants/ica-padel/g1.jpg", "r2://tenants/ica-padel/g2.jpg", "..."]
    },
    "style": { "bgColor": "white", "paddingY": "md" }
  },
  {
    "id": "s5",
    "type": "contact",
    "order": 4,
    "visible": true,
    "variant": "with-form",
    "content": {
      "phone": "+51 956 123 456",
      "email": "info@icapadelclub.pe",
      "whatsapp": "+51956123456",
      "instagram": "@icapadelclub.pe",
      "formEnabled": true
    },
    "style": { "bgColor": "brand", "textColor": "light", "paddingY": "lg" }
  }
]
```

---

## 5. Arquitectura técnica

### 5.1 Flujo completo

```
Admin edita secciones en el builder (React SPA)
    │
    ├── PUT /v1/site/pages/:slug  →  guarda en D1 (site_pages)
    │
    ├── POST /v1/site/publish     →  serializa secciones a HTML
    │                                  guarda HTML en KV (site:{slug}:html)
    │                                  invalida cache CDN
    │
    └── Visitante pide slug.canchapro.com
            │
            Worker (club-site) lee KV (site:{slug}:html)
            │
            └── Sirve HTML pre-renderizado (edge cache 5 min)
```

### 5.2 Rendering strategy

**Pre-render on publish, serve from KV.**

Cuando el admin hace "Publicar":
1. El API lee las secciones de D1
2. Renderiza el HTML completo (server-side con los section renderers)
3. Guarda el HTML final en KV (`site:{slug}:html`)
4. El Worker de club-site simplemente lee y sirve el HTML desde KV (ultra-rápido)

Ventajas:
- **TTFB ~10ms** desde edge (HTML pre-renderizado en KV)
- **SEO perfecto** (HTML completo, no SPA)
- **Sin CPU en cada request** (el Worker solo lee KV)
- Cache invalidation solo al publicar

### 5.3 Dónde vive cada pieza

| Componente | Paquete | Tech |
|---|---|---|
| Builder UI (editor de secciones) | `web/` | React + DnD (drag-and-drop) |
| API de páginas | `packages/api` | Hono routes (`/v1/site/pages`) |
| Renderer HTML | `packages/api` o `packages/shared` | Template functions (como template.ts actual) |
| Servidor de sitios | `packages/club-site` | Worker que lee KV y sirve HTML |
| Almacén de imágenes | R2 | Cloudflare R2 |
| Cache de HTML | KV | Cloudflare KV |

---

## 6. UI del Builder (admin panel)

### 6.1 Ubicación en el panel

```
Sidebar nav:
  ...
  Configuración
    Marca           ← se fusiona con el builder (redirige a /site-builder)
    ...

  /site-builder     ← nueva ruta principal
  /site-builder/preview  ← preview en iframe
```

### 6.2 Layout del builder

```
┌─────────────────────────────────────────────────────────────┐
│  ← Volver al panel        Site Builder        [Publicar ▼]  │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  SECCIONES │   CANVAS / PREVIEW                             │
│            │                                                │
│  [+ Hero]  │   ┌──────────────────────────────────────┐     │
│  [+ About] │   │  HERO                          [⚙][✕] │    │
│  [+ Galería│   │  "Bienvenido a Ica Padel Club"       │     │
│  [+ CTA]   │   └──────────────────────────────────────┘     │
│  ...       │                                                │
│            │   ┌──────────────────────────────────────┐     │
│  ────────  │   │  ABOUT                         [⚙][✕] │    │
│            │   │  "Somos el primer club..."            │     │
│  ACTIVAS:  │   └──────────────────────────────────────┘     │
│  ☰ Hero    │                                                │
│  ☰ About   │   ┌──────────────────────────────────────┐     │
│  ☰ Gallery │   │  GALLERY                       [⚙][✕] │    │
│  ☰ Contact │   │  [img] [img] [img]                   │     │
│            │   └──────────────────────────────────────┘     │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│  ← Anterior    Paso 2 de 3    Siguiente →                   │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Flujo del admin

1. **Elige secciones** — panel izquierdo muestra la librería, click para agregar
2. **Reordena** — drag-and-drop de las secciones activas en el panel izquierdo
3. **Edita** — click en una sección en el canvas abre panel de edición (inline o modal)
4. **Preview** — botón para ver el sitio completo en una pestaña nueva
5. **Publica** — botón "Publicar" guarda + pre-renderiza + invalida cache
6. **SEO** — tab separado para editar meta title, description, OG image

### 6.4 Estados

| Estado | Qué ve el admin |
|---|---|
| **Sin sitio** | Wizard de onboarding: "Crea tu sitio en 3 pasos" (elige template → edita → publica) |
| **Borrador** | Banner amarillo: "Tienes cambios sin publicar" con botón Publicar |
| **Publicado** | Badge verde "Publicado" + link al sitio |
| **Editando** | Cambios locales, botón "Publicar" habilitado |

---

## 7. Templates iniciales

Al crear su sitio, el club elige un **template** que pre-llena secciones con contenido de ejemplo:

| Template | Secciones incluidas | Para quién |
|---|---|---|
| **Club básico** | Hero, About, Courts (auto), Gallery, Contact | Clubs nuevos, 1-2 canchas |
| **Club profesional** | Hero, Sports, Courts (auto), Pricing (auto), Gallery, Team, Testimonials, Contact, FAQ | Clubs medianos con academia |
| **Centro deportivo** | Hero, Sports, Courts (auto), Schedule (auto), Pricing, Gallery, Team, Location, Contact, CTA | Centros multi-deporte |

El admin puede agregar/eliminar secciones después de elegir el template.

---

## 8. API endpoints

```
GET    /v1/site/pages                    → lista de páginas del tenant
GET    /v1/site/pages/:slug              → detalle de una página (secciones)
POST   /v1/site/pages                    → crear nueva página
PUT    /v1/site/pages/:slug              → actualizar secciones/contenido
DELETE /v1/site/pages/:slug              → eliminar página

POST   /v1/site/pages/:slug/publish      → pre-renderizar y publicar
POST   /v1/site/pages/:slug/unpublish    → despublicar

GET    /v1/site/templates                → lista de templates disponibles
POST   /v1/site/pages/from-template      → crear página desde template

POST   /v1/site/upload                   → subir imagen a R2 (ya existe)

GET    /v1/site/sections/library         → catálogo de secciones disponibles
```

---

## 9. SEO y rendimiento

### 9.1 SEO features

- **Meta tags** editables por página: title, description, OG image
- **Structured data** automático: `LocalBusiness` schema con nombre, dirección, teléfono, horarios
- **Sitemap** auto-generado en `slug.canchapro.com/sitemap.xml`
- **Canonical URL** automática
- **Alt text** en imágenes (campo editable)
- **Heading structure** correcta (H1 → H2 → H3 por sección)

### 9.2 Performance targets

| Métrica | Target |
|---|---|
| TTFB | < 50ms (HTML pre-renderizado en KV edge) |
| LCP | < 1.5s |
| CLS | < 0.05 |
| FID | < 50ms |
| HTML size | < 100KB (sin imágenes) |
| Images | WebP auto-convert, lazy loading, srcset responsive |

### 9.3 Image optimization

Las imágenes subidas a R2 se sirven con:
- **Cloudflare Image Resizing** para generar variantes (thumbnail, medium, large)
- **Lazy loading** (`loading="lazy"`) para imágenes below the fold
- **WebP auto-detection** vía `Accept` header
- **Max upload**: 5MB por imagen, 12 imágenes por galería

---

## 10. Pricing y disponibilidad

### Opción A — Incluido por tier

| Tier | Qué incluye |
|---|---|
| **Starter** | Sitio básico (template fijo, 1 página, sin SEO avanzado) |
| **Pro** | Builder completo (todas las secciones, SEO, 1 página) |
| **Business** | Builder + multi-página + dominio custom + analytics |

### Opción B — Add-on del marketplace

| Add-on | Precio | Incluye |
|---|---|---|
| **Site Builder** | S/ 39/mes | Builder completo, todas las secciones, SEO, 1 página |
| **Multi-página** | S/ 19/mes (add-on sobre Builder) | Hasta 5 páginas adicionales |
| **Dominio personalizado** | S/ 29/mes (ya existe como add-on) | `app.tuclub.pe` |

### Recomendación

**Opción A** (incluido por tier) es mejor para adoption. El builder es un **feature de retención** más que de revenue: cuanto más invierte el club en su sitio, más difícil es que se vaya. El revenue viene del plan base, no del builder.

- **Starter:** Template fijo (como hoy)
- **Pro:** Builder con todas las secciones
- **Business:** Builder + multi-página + dominio

---

## 11. Métricas de éxito

| Métrica | Target (3 meses post-lanzamiento) |
|---|---|
| % de clubs Pro/Business que publican un sitio | > 60% |
| Secciones promedio por sitio | > 5 |
| Tiempo promedio para publicar primer sitio | < 15 minutos |
| Tráfico mensual promedio a sitios publicados | > 200 visitas/club |
| NPS del builder | > 40 |
| Churn de clubs con sitio publicado vs. sin sitio | -30% churn |

---

## 12. Fases de implementación

### Fase 1 — MVP Builder (3-4 semanas)

- Schema `site_pages` con JSON de secciones
- API CRUD + publish
- 8 secciones core: hero, about, courts, gallery, contact, location, cta, spacer
- Builder UI en el panel admin (agregar, editar, reordenar, eliminar secciones)
- 2 templates iniciales (Club básico, Club profesional)
- Renderer HTML con secciones dinámicas
- Pre-render on publish → KV → Worker sirve

### Fase 2 — SEO + Polish (2 semanas)

- Meta tags editables (title, description, OG)
- Structured data `LocalBusiness` automático
- Sitemap auto-generado
- Image optimization (resize, WebP)
- Preview en tiempo real (iframe)
- Secciones adicionales: pricing, schedule, testimonials, team, faq

### Fase 3 — Multi-página + Analytics (2 semanas)

- Soporte para múltiples páginas (home, about, clases, precios)
- Navegación auto-generada entre páginas
- Analytics básico (visitas, fuentes, páginas vistas)
- Formulario de contacto (envía notificación al admin)
- Instagram embed
- Custom HTML section

### Fase 4 — Advanced (futuro)

- A/B testing de secciones
- Blog / noticias
- Integración con bookings (widget de reserva embebido)
- Multi-idioma
- Temas visuales (dark mode, glassmorphism, etc.)

---

## 13. Dependencias y riesgos

| Riesgo | Mitigación |
|---|---|
| Builder complejo de implementar | Empezar con formularios, no drag-and-drop visual. DnD se agrega en Fase 2 |
| Performance del renderer | Pre-render on publish, servir HTML estático desde KV |
| Imágenes pesadas | Cloudflare Image Resizing + max 5MB + lazy loading |
| SEO indexing lento | Sitemap + structured data desde el día 1 |
| Clubs no usan el builder | Templates pre-llenados con datos del club (auto-populate courts, horarios, branding) |
| HTML injection en custom_html | Sanitizar + CSP headers. Solo disponible en plan Business |

---

## 14. Competencia directa

| Feature | Playtomic | ATC Sports | Padel iQ | TPC | **CanchaPro (propuesto)** |
|---|---|---|---|---|---|
| Sitio web del club | Solo perfil en marketplace | No | CMS básico | White-label | **Builder de secciones** |
| Dominio propio | No | No | Si | Si | **Si** |
| Personalización visual | No | No | Limitada | Moderada | **Alta (secciones + colores + variantes)** |
| SEO | No aplica | No | Básico | Básico | **Completo (meta, structured data, sitemap)** |
| Multi-página | No | No | No | Si | **Si (Fase 3)** |

**CanchaPro sería el primer SaaS de gestión de clubs deportivos en LATAM con website builder integrado.**

---

*PRD v1.0 — Marzo 2026 — Lumini*
