# Ica Padel Club — Revision de MVP y Preguntas para Stakeholder

**Preparado por:** Lumini
**Fecha:** 27 de marzo de 2026
**Estado:** Demo funcional lista para validacion

---

## 1. Puntos a revisar con el stakeholder

### 1.1 Devoluciones y cancelaciones

El sistema actual **no incluye logica de devoluciones**. Esto fue intencional para definirlo junto al stakeholder.

**Preguntas:**
- Cuando un socio cancela una reserva, se le devuelven los creditos? Siempre, o solo bajo ciertas condiciones?
- Existe una ventana de cancelacion? Por ejemplo: cancelar con mas de 24h de anticipacion = reembolso total, menos de 24h = sin reembolso, o algun porcentaje?
- Quien puede hacer excepciones? Solo el admin, o tambien el staff?
- Si se bloquea una cancha y hay reservas activas, el club reembolsa automaticamente o se gestiona caso por caso?
- Los creditos devueltos vuelven al saldo del socio, o se emite algun tipo de "nota de credito" separada?

---

### 1.2 Bloqueo de canchas

El sistema permite bloquear canchas por dia completo o rango horario, y detecta reservas confirmadas que entran en conflicto.

**Preguntas:**
- Cuando se bloquea una cancha con reservas existentes, que pasa con esas reservas? Se cancelan automaticamente? Se reubican? Se notifica al socio?
- Quien tiene permiso de bloquear canchas? Solo admin, o staff tambien?
- Se necesita un motivo obligatorio para bloquear? (actualmente es opcional)
- Hay bloqueos recurrentes? Por ejemplo: mantenimiento todos los lunes de 6am a 8am.
- Los bloqueos afectan solo la disponibilidad futura, o tambien deben reflejarse en reportes/dashboard?

---

### 1.3 Sistema de creditos

**Preguntas:**
- Los creditos se compran o se asignan como parte de una membresia mensual? O ambos?
- Los creditos tienen vencimiento? (ej: creditos no usados al fin de mes se pierden)
- Se pueden acumular creditos de un mes a otro?
- Existe un precio fijo por credito en soles (ej: 1 credito = S/ 3.00), o varia segun paquetes?
- Un socio puede comprar creditos adicionales fuera de su asignacion mensual?
- El multiplicador de precio por cancha (ej: Court 2 = x1.5) refleja la realidad? Como se determina?

---

### 1.4 Precios y horarios

**Preguntas:**
- Los 3 bloques horarios (manana/tarde/noche) y sus precios reflejan la estructura real del club?
- El precio diferenciado entre semana y fin de semana es correcto?
- Hay horarios especiales? (feriados, horario de verano, eventos)
- El horario de apertura/cierre varia por cancha o es igual para todas?
- Existe un "horario pico" con precio diferente al horario regular dentro del mismo bloque?

---

### 1.5 Roles y permisos

**Preguntas:**
- La separacion actual es: Admin (todo), Staff (operacion sin dashboard/metricas), Socio (reservas y saldo). Es correcto?
- El staff puede modificar precios de creditos?
- El staff puede crear/editar canchas o solo ver?
- Hay algun rol adicional necesario? (ej: "Entrenador" que puede reservar en nombre de un socio)
- Los socios pueden ver las canchas disponibles sin estar logueados? (pantalla publica)

---

### 1.6 Identificacion de socios (QR / RFID)

El QR fue solicitado como identificador temporal. Segun lo conversado, luego se entregaran tarjetas RFID por tema de estatus.

**Preguntas:**
- El QR actualmente codifica el ID y nombre del socio. Que informacion debe contener para que sea escaneable en recepcion?
- Hay un lector de QR/RFID en la entrada del club, o el staff lo escanea manualmente?
- El QR/RFID se usa solo para identificacion, o tambien para registrar check-in/asistencia?
- Al presentar el QR, el staff ve los datos del socio? (nombre, saldo, reservas del dia)
- Cuando se migre a RFID, el QR seguira activo como backup (ej: si el socio olvida su tarjeta)?
- Las tarjetas RFID se van a vincular al sistema? Si es asi, necesitamos definir el hardware (lector) y protocolo.

---

### 1.7 Reservas

**Preguntas:**
- Un socio puede tener multiples reservas el mismo dia?
- Hay un limite de reservas activas por socio?
- Se puede reservar para mas de 1 hora consecutiva? (ej: 2 horas seguidas)
- Cuantos dias de anticipacion se puede reservar? (actualmente no hay limite)
- Un socio puede reservar en nombre de otro socio?
- Existe reserva recurrente? (ej: todos los martes a las 7pm)
- Que pasa si un socio no se presenta? (no-show) Se le cobra igual?

---

### 1.8 Miembros

**Preguntas:**
- Como se da de alta un nuevo socio? El admin lo registra, o el socio se registra solo?
- Hay un proceso de aprobacion? (solicitud → revision → activacion)
- Que datos del socio son obligatorios? (nombre, email, telefono, DNI, direccion?)
- Un socio suspendido puede ver su historial, o se le bloquea todo acceso?
- Hay tipos de membresia? (ej: basico = 30 cr/mes, premium = 50 cr/mes, VIP = ilimitado)

---

### 1.9 Notificaciones

**Preguntas:**
- Se necesitan notificaciones? (email, WhatsApp, push)
- En que eventos? Posibles: confirmacion de reserva, recordatorio pre-reserva, cancelacion, creditos bajos, creditos recargados, bloqueo de cancha.
- WhatsApp es canal prioritario para socios en Peru?

---

## 2. Flujos a validar en la demo

Pedirle al stakeholder que recorra estos flujos y valide si reflejan la operacion real:

| # | Flujo | Ruta | Validar |
|---|-------|------|---------|
| 1 | Login por rol | `/login` | Los 3 perfiles muestran los modulos correctos? |
| 2 | Home admin | `/` (admin) | Los modulos y metricas rapidas son utiles? |
| 3 | Home staff | `/` (staff) | Las acciones rapidas reflejan el dia a dia del staff? |
| 4 | Home socio | `/` (member) | La pantalla de reserva como landing es correcta? |
| 5 | Crear/editar cancha | `/courts` → Canchas | El versionamiento tiene sentido? Se entiende? |
| 6 | Horarios de cancha | `/courts` → Horarios | Los horarios de apertura/cierre son editables por dia? |
| 7 | Bloquear cancha | `/courts` → Bloqueos | La deteccion de conflictos es clara? |
| 8 | Reservar cancha | `/` (member) | El flujo de doble click para confirmar es intuitivo? |
| 9 | Cancelar reserva | `/my-bookings` | El dialogo de confirmacion es suficiente? |
| 10 | Ver saldo | `/balance` | La info de creditos y transacciones es clara? |
| 11 | Vender creditos | `/credits` → Venta | El flujo de registrar una venta es practico para el staff? |
| 12 | Editar precios | `/credits` → Precios | La matriz de precios por horario/dia es correcta? |
| 13 | Gestion miembros | `/members` | Los estados (activo/suspendido/inactivo) cubren todos los casos? |
| 14 | Dashboard | `/dashboard` | Las metricas y graficos son los que necesitan? Falta alguno? |
| 15 | QR del socio | `/my-qr` | El QR cumple con lo que necesitan para identificacion? |
| 16 | Recuperar contrasena | `/forgot-password` | Los metodos de recuperacion por rol son correctos? |

---

## 3. Propuesta de Roadmap

### Fase 1 — MVP Validado (actual)
**Estado:** Listo para revision
- Login por roles (admin, staff, socio)
- Gestion de canchas con versionamiento
- Horarios y bloqueos de canchas
- Reservas con sistema de creditos
- Gestion de miembros
- Venta de creditos con registro de pagos
- Dashboard con metricas basicas
- QR de identificacion
- Recuperacion de contrasena

### Fase 2 — Operacion real
**Objetivo:** Poner el sistema en produccion con datos reales

- **Backend Django + API REST** — migrar toda la logica mock a endpoints reales con base de datos
- **Autenticacion real** — email/password con JWT, recuperacion de contrasena funcional
- **Politica de cancelaciones** — implementar reglas de reembolso segun lo definido con el stakeholder
- **Notificaciones** — confirmacion de reserva y recordatorios por email (y WhatsApp si aplica)
- **App mobile (React Native)** — version movil para socios con reserva, saldo y QR
- **Check-in con QR** — pantalla de staff para escanear QR y ver datos del socio

### Fase 3 — Sistema contable basico
**Objetivo:** Que el sistema sea el registro financiero del club

- **Pasarela de pagos** — integracion con Yape/Plin (QR de cobro), transferencia bancaria, y eventualmente tarjeta
- **Emision de comprobantes** — boletas/facturas electronicas con SUNAT (o integracion con Nubefact/PSE)
- **Registro de ingresos** — cada venta de creditos genera un comprobante y se refleja en un libro de ventas
- **Conciliacion** — vista admin para cruzar ventas registradas vs depositos bancarios
- **Reporte de caja diaria** — cierre de caja por turno de staff con detalle de cobros
- **Exportacion contable** — exportar datos en formato compatible con el contador (Excel, PDF)

### Fase 4 — Reporteria avanzada
**Objetivo:** Inteligencia de negocio para el club

- **Ocupacion por cancha/hora/dia** — identificar horarios muertos y oportunidades de pricing dinamico
- **Retencion de socios** — quienes reservan frecuentemente, quienes dejaron de venir, creditos sin usar
- **Proyeccion de ingresos** — basado en creditos vendidos vs consumidos
- **Ranking de socios** — por frecuencia, gasto, antiguedad
- **Reportes descargables** — PDF y Excel para directiva/inversionistas

### Fase 5 — RFID y experiencia premium
**Objetivo:** Elevar la experiencia del socio

- **Tarjetas RFID** — vinculacion de tarjeta con cuenta, check-in automatico al pasar por el lector
- **Torniquete/acceso fisico** — integracion con hardware de control de acceso
- **Pantalla en recepcion** — display con reservas del dia, cancha asignada, bienvenida al socio
- **Programa de fidelidad** — beneficios por frecuencia, referidos, antiguedad

### Fase 6 — Ecosistema completo
**Objetivo:** Ser el sistema operativo del club

- **Gestion de torneos** — inscripciones, brackets, resultados
- **Tienda/cafeteria** — venta de productos con creditos o efectivo
- **Clases y entrenadores** — reserva de clases, agenda de entrenadores
- **Multi-sede** — si el club crece a mas de una ubicacion

---

## 4. Proximos pasos

1. **Reunion de validacion** — recorrer la demo con el stakeholder usando esta guia
2. **Documentar decisiones** — sobre cancelaciones, creditos, permisos y notificaciones
3. **Priorizar Fase 2** — definir que es critico para ir a produccion
4. **Estimar y planificar** — sprint de desarrollo para el backend + mobile
