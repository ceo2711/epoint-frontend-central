# Integración Calendly — ePoint CRM

Documentación completa de la integración entre ePoint CRM y [Calendly](https://calendly.com). Permite a los vendedores conectar su cuenta, ver y gestionar reuniones desde el calendario interno, compartir links públicos y operar el calendario desde el chatbot.

**Ruta en la app:** `/calendario`  
**Roles con acceso:** `ADMIN` (solo lectura de vendedores) y `SALES_REP` (gestión completa de su propio calendario)

---

## Tabla de contenidos

1. [¿Qué necesitás?](#1-qué-necesitás)
2. [Cómo obtener el Personal Access Token](#2-cómo-obtener-el-personal-access-token)
3. [Conectar Calendly al CRM](#3-conectar-calendly-al-crm)
4. [Vista de calendario (UI)](#4-vista-de-calendario-ui)
5. [Crear una reunión](#5-crear-una-reunión)
6. [Editar / reprogramar una reunión](#6-editar--reprogramar-una-reunión)
7. [Cancelar / eliminar una reunión](#7-cancelar--eliminar-una-reunión)
8. [Preguntas personalizadas de Calendly](#8-preguntas-personalizadas-de-calendly)
9. [Links públicos para clientes](#9-links-públicos-para-clientes)
10. [Sincronización con Calendly](#10-sincronización-con-calendly)
11. [Notificaciones in-app](#11-notificaciones-in-app)
12. [Chatbot — gestión del calendario](#12-chatbot--gestión-del-calendario) (con ejemplos conversacionales completos)
13. [API REST (backend)](#13-api-rest-backend)
14. [Roles y permisos](#14-roles-y-permisos)
15. [Base de datos](#15-base-de-datos)
16. [Arquitectura de archivos](#16-arquitectura-de-archivos)
17. [Limitaciones conocidas](#17-limitaciones-conocidas)
18. [Solución de problemas](#18-solución-de-problemas)

---

## 1. ¿Qué necesitás?

| Requisito | Detalle |
|-----------|---------|
| **Cuenta Calendly** | Una por vendedor (`SALES_REP`). Cada vendedor conecta su propia cuenta. |
| **Tipos de evento activos** | En Calendly deben existir tipos de reunión configurados (ej. "30 Minute Meeting"). |
| **Personal Access Token (PAT)** | Token de API generado manualmente en Calendly (no hay OAuth en esta integración). |
| **Scope `scheduled_events:write`** | Obligatorio si querés **crear, editar o cancelar** reuniones desde el CRM o el chatbot. Sin este scope solo podés leer/sincronizar. |
| **`ENCRYPTION_KEY` en el backend** | Variable de entorno del servidor para cifrar el token en base de datos. No hay variables `CALENDLY_*` adicionales. |

### Lo que NO se necesita

- OAuth de Calendly (no implementado).
- Webhooks de Calendly (no implementado; la detección de reuniones nuevas es por sincronización periódica).
- Que el `ADMIN` tenga cuenta Calendly (el admin solo supervisa vendedores).

---

## 2. Cómo obtener el Personal Access Token

### Pasos en Calendly

1. Iniciá sesión en [calendly.com](https://calendly.com).
2. Andá a **Integraciones** → **API & Webhooks**.
3. En la sección **Personal Access Tokens**, hacé clic en **Create Token** (o equivalente).
4. Asignale un nombre descriptivo (ej. `ePoint CRM`).
5. Seleccioná el scope **`scheduled_events:write`** si vas a gestionar reuniones desde el CRM.
6. Copiá el token generado (formato típico: `eyJ...`). **Solo se muestra una vez.**

### URL oficial de documentación

- API Calendly v2: [https://developer.calendly.com](https://developer.calendly.com)
- Base URL usada por el backend: `https://api.calendly.com`

### Validación en el CRM

Al conectar, el backend llama a `GET /users/me` con el token. Si es inválido o expiró, verás un error y deberás generar uno nuevo en **Configuración de Calendly** dentro de `/calendario`.

---

## 3. Conectar Calendly al CRM

> Solo el rol **`SALES_REP`** puede conectar, actualizar o desconectar su cuenta.

1. Iniciá sesión como vendedor.
2. Andá a **Calendario** (`/calendario`).
3. Si no hay conexión, aparece el panel **Conectar Calendly** (`CalendlyConnectPanel`).
4. Completá el formulario (`CalendlyTokenForm`):
   - **Personal Access Token** (obligatorio)
   - **URL pública de agendamiento** (opcional; si no la ingresás, el sistema intenta obtenerla de la API usando el slug de tu usuario Calendly)
5. Hacé clic en **Conectar cuenta**.

### Qué hace el backend al conectar

1. Valida el token contra Calendly (`/users/me`).
2. Guarda o actualiza el registro en `calendly_connections` (token cifrado con AES-GCM).
3. Ejecuta una **sincronización inicial** de eventos (últimos 30 días + próximos 180 días).
4. Devuelve el estado de conexión al frontend.

### Actualizar o desconectar

- **Menú de acciones** (ícono en la esquina del calendario) → **Configuración de Calendly** (`CalendlySettingsModal`).
- **Guardar token:** mismo flujo que conectar (`POST /calendly/connection`).
- **Desconectar:** elimina la conexión (`DELETE /calendly/connection`). Los eventos históricos en BD local **no se borran**, pero dejan de sincronizarse.

---

## 4. Vista de calendario (UI)

### Vendedor (`SALES_REP`)

| Elemento | Componente | Descripción |
|----------|------------|-------------|
| Calendario | `CalendlyCalendarView` | FullCalendar con vistas mes / semana / día |
| Menú de acciones | `CalendlyActionsMenu` | Nueva reunión, sincronizar, configuración |
| Links para compartir | `CalendlyShareLink` | URLs públicas por tipo de evento |
| Detalle de evento | `CalendlyEventModal` | Ver invitado, fecha, link de Zoom/Meet |
| Formulario | `CalendlyEventFormModal` | Crear o editar reunión |

**Interacciones:**
- Clic en un **slot vacío** del calendario → abre modal de nueva reunión con esa fecha preseleccionada.
- Clic en un **evento existente** → modal de detalle.
- Desde el detalle podés **Editar** o **Cancelar reunión**.

### Administrador (`ADMIN`)

| Elemento | Componente | Descripción |
|----------|------------|-------------|
| Lista de vendedores | `SalesRepList` | Muestra quién tiene Calendly conectado |
| Calendario del vendedor | `CalendlyCalendarView` | Solo lectura |
| Links del vendedor | `CalendlyShareLink` | Solo lectura |

El admin **no puede** crear, editar ni cancelar reuniones. Si el vendedor no conectó Calendly, se muestra un mensaje informativo.

### Auto-actualización del calendario

El hook `useCalendly` refresca eventos automáticamente:

- Cada **90 segundos** mientras la página está abierta (`EVENTS_AUTO_SYNC_MS`).
- Al volver a la pestaña del navegador (`visibilitychange`).
- Cuando el chatbot modifica el calendario (evento `epoint:calendly-refresh`).

---

## 5. Crear una reunión

### Desde la UI (`CalendlyEventFormModal`)

1. **Menú de acciones** → **Nueva reunión**, o clic en un slot del calendario.
2. Elegí el **tipo de reunión** (se cargan desde Calendly).
3. Elegí la **fecha** (mínimo: hoy).
4. Elegí un **horario disponible** (se consultan slots en tiempo real a Calendly).
5. Completá **nombre** y **email** del invitado.
6. Respondé las **preguntas personalizadas** del tipo de evento (si las hay).
7. Guardá.

### Qué hace el backend (`POST /calendly/events`)

1. Valida permisos (`SALES_REP` + Calendly conectado + scope de escritura).
2. Prepara las respuestas a preguntas custom (`questions_and_answers`).
3. Llama a Calendly `POST /invitees` para reservar el slot.
4. Sincroniza eventos (`sync_events` con `notify_new_events=False` — no notifica al vendedor porque él mismo creó la reunión).
5. Busca el evento recién creado en BD local y devuelve la respuesta.

### Zona horaria en la UI

El formulario usa la zona horaria del navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`).

---

## 6. Editar / reprogramar una reunión

> Calendly **no tiene API de reprogramación in-place**. Editar en el CRM = **cancelar el evento anterior y crear uno nuevo**.

### Desde la UI

1. Abrí el evento en el calendario → **Editar** (`CalendlyEventModal`).
2. Se abre `CalendlyEventFormModal` en modo edición con los datos actuales.
3. Modificá tipo, fecha, horario, invitado o preguntas custom.
4. Guardá.

### Qué hace el backend (`PATCH /calendly/events/{id}`)

1. Si no hay cambios respecto al evento actual, devuelve el mismo sin llamar a Calendly.
2. Cancela el evento anterior en Calendly con razón: *"Reprogramado desde ePoint Central"*.
3. Marca el evento local como `canceled`.
4. Crea la nueva reserva vía `POST /invitees`.
5. Sincroniza y devuelve el nuevo evento.

**Importante:** el `id` local en BD puede cambiar tras reprogramar, porque es un evento nuevo en Calendly con un URI distinto.

---

## 7. Cancelar / eliminar una reunión

### Desde la UI

1. Abrí el evento → **Cancelar reunión**.
2. Confirmá en el diálogo de confirmación.
3. El evento desaparece del calendario activo (queda con `status = "canceled"` en BD).

### Qué hace el backend (`DELETE /calendly/events/{id}`)

1. Llama a Calendly `POST /scheduled_events/{uuid}/cancellation`.
2. Marca el evento local como `canceled`.
3. Calendly envía la notificación de cancelación al invitado por su canal habitual (email de Calendly).

El campo `reason` existe en el schema pero la UI actual no lo envía.

---

## 8. Preguntas personalizadas de Calendly

Si configuraste preguntas custom en un tipo de evento de Calendly, aparecen en el formulario al crear o editar (`CalendlyCustomQuestionFields`).

### Cómo se cargan

1. Al elegir un tipo de evento, el frontend llama a `GET /calendly/event-types/detail?event_type_uri=...`.
2. El backend obtiene el detalle completo del tipo (`GET /event_types/{uuid}`) incluyendo `custom_questions`.
3. Solo se muestran preguntas con `enabled: true` y con `name`, ordenadas por `position`.

### Tipos de pregunta soportados en UI

| Tipo en Calendly | Widget en CRM |
|------------------|---------------|
| `string` / texto corto | Input de texto |
| `text` / `multi_line` | Textarea |
| `single_select` | Select (+ opción "Otro" si `include_other`) |
| `multi_select` | Checkboxes (respuesta unida con `, `) |
| `phone_number` | Input `tel` |
| Otros | Input de texto genérico |

### Cómo se guardan

- Al reservar, el backend envía a Calendly `questions_and_answers` con `question_uuid` + `answer` (o `question` + `position` si no hay UUID).
- En BD local, las respuestas se almacenan concatenadas en `invitee_comment`:

```
Pregunta 1: respuesta
Pregunta 2: otra respuesta
```

- Al editar, `parseStoredAnswers` reconstruye los valores desde ese texto.

### Caché de tipos de evento

Los tipos de evento se cachean en `localStorage` por vendedor, TTL de **7 días** (`eventTypesCache.ts`, versión 3). El detalle con preguntas custom se carga siempre al abrir el formulario.

---

## 9. Links públicos para clientes

La sección **Links para clientes** (`CalendlyShareLink`) muestra:

- La **página general de agendamiento** del vendedor.
- Un link por cada **tipo de evento** que tenga `scheduling_url`.

Podés copiar o abrir cada link. Los clientes agendan directamente en Calendly; esas reuniones aparecen en el CRM tras la próxima sincronización.

---

## 10. Sincronización con Calendly

### Ventana de sincronización

| Dirección | Días |
|-----------|------|
| Pasado | 30 (`SYNC_PAST_DAYS`) |
| Futuro | 180 (`SYNC_FUTURE_DAYS`) |

### Cuándo se sincroniza

| Trigger | Quién dispara | Notifica al vendedor |
|---------|---------------|----------------------|
| Conectar Calendly | Vendedor | No (sync inicial) |
| `POST /calendly/sync` manual | Vendedor o Admin | Solo si hay eventos **nuevos** detectados |
| `GET /calendly/events` si pasaron >3 min desde último sync | Automático (backend) | Solo eventos nuevos |
| Auto-refresh frontend (90 s) | Página `/calendario` | Solo eventos nuevos |
| Crear/editar desde CRM o chatbot | Vendedor | No (`notify_new_events=False`) |

### Qué se sincroniza por evento

- Nombre, estado (`active` / `canceled`), inicio y fin.
- Tipo de evento (nombre y URI).
- Primer invitado: nombre, email, comentarios/Q&A.
- Ubicación y URL de reunión (`meeting_url` — Zoom, Google Meet, etc.).

### Upsert por URI

Los eventos se identifican por `calendly_event_uri` (único). Si Calendly devuelve un evento nuevo con URI distinto, se crea una fila nueva. **No se eliminan** eventos locales que ya no aparecen en la respuesta de Calendly.

---

## 11. Notificaciones in-app

Cuando un vendedor recibe una **reunión nueva** (detectada en sync, no creada por él desde el CRM), se genera:

| Campo | Valor |
|-------|-------|
| Tipo | `CALENDLY_EVENT_SCHEDULED` |
| Canal | Solo in-app (campana del header) |
| Título | "Nueva reunión agendada" |
| Cuerpo | `{invitado} agendó «{tipo}» el {fecha hora UTC}.` |
| Navegación | Clic → `/calendario` |

### Entrega en tiempo real

Las notificaciones se envían por **SSE** (`GET /api/v1/notifications/stream`) al vendedor conectado en la app. No hace falta abrir la campana manualmente.

### Cuándo NO se notifica

- Primera sincronización al conectar (evita spam de reuniones históricas).
- Reuniones creadas/reprogramadas por el propio vendedor desde CRM o chatbot.
- Reuniones canceladas (no hay evento `CALENDLY_EVENT_CANCELED` implementado).

---

## 12. Chatbot — gestión del calendario

El chatbot integra el calendario para vendedores con Calendly conectado. Podés operar **todo el ciclo de vida de una reunión** desde el chat flotante: consultar agenda, crear, reprogramar y cancelar.

### Requisitos previos

1. Rol **`SALES_REP`** (solo vendedores gestionan; admin solo puede listar si tuviera conexión).
2. Calendly conectado en `/calendario` con token válido y scope `scheduled_events:write`.
3. Abrir el **chat flotante** (ícono en la esquina de la app).

Si no hay conexión y escribís algo relacionado al calendario, el bot responde:

> **Bot:** No tenés Calendly conectado. Conectalo desde el calendario antes de gestionar reuniones.

### Panel interactivo (violeta)

Cuando el bot entra en un flujo de calendario, aparece el panel **Calendario** (`ChatCalendlyPanel`) debajo del mensaje. Según el paso muestra:

| Paso | Qué ves en el panel |
|------|---------------------|
| `event_type` | Botones con cada tipo de reunión (`1. 30 Minute Meeting`, etc.) |
| `date` | Selector de fecha + botón **Ver horarios** |
| `slot` | Botones con horarios disponibles (`1. 02:30 PM`, etc.) |
| `invitee` | Formulario: nombre, email, preguntas custom + **Agendar reunión** / **Reprogramar reunión** |
| `events_list` | Lista de reuniones con botones **Reprogramar** y **Cancelar** por cada una |

Podés usar **solo texto**, **solo el panel**, o **combinar ambos** en el mismo flujo.

### Formas de referenciar opciones

| Qué elegís | Por número | Por ID / texto |
|------------|------------|----------------|
| Tipo de evento | `1` | `30 Minute Meeting` |
| Horario | `2` | `14:30` o `2:30 pm` |
| Reunión existente | `3` (posición en la lista) | `#42` o `reunión 42` |
| Fecha | — | `15/06/2026`, `2026-06-15`, `hoy`, `mañana` |
| Confirmar | — | `confirmar`, `si`, `ok`, `dale`, `listo` |

Los IDs (`#42`) son el **ID local** del CRM (`calendly_events.id`), no el URI de Calendly.

---

### Ejemplo 1 — Ver mis reuniones de hoy

**Vos:**
```
mis reuniones de hoy
```

**Bot:**
```
Reuniones de hoy:

- **#12** 30 Minute Meeting — 11/06/2026 10:00 · Juan Pérez (juan@empresa.com)
- **#15** Reunión de prueba — 11/06/2026 15:30 · María López (maria@gmail.com)
```

También funciona con: `qué tengo hoy`, `agenda de hoy`, `reuniones de hoy`, `today's meetings`.

---

### Ejemplo 2 — Ver agenda de la semana

**Vos:**
```
agenda de la semana
```

**Bot:** lista reuniones activas de los próximos **7 días** con el mismo formato (`#id`, nombre, fecha, invitado).

Variantes: `mis reuniones de la semana`, `calendario de la semana`, `week's meetings`.

---

### Ejemplo 3 — Sin reuniones en el período

**Vos:**
```
qué tengo hoy
```

**Bot** *(si no hay reuniones activas hoy)*:
```
Reuniones de hoy:

No tenés reuniones programadas para ese período.
```

Para ver más días usá `agenda de la semana`.

---

### Ejemplo 4 — Crear reunión (solo texto)

**Vos:**
```
agendar reunión
```

**Bot:**
```
Elegí el tipo de reunión.
```
*(panel con botones de tipos)*

**Vos:**
```
1
```

**Bot:**
```
Tipo 30 Minute Meeting. Decime la fecha (DD/MM/AAAA, hoy o mañana).
```

**Vos:**
```
mañana
```

**Bot:**
```
Fecha 2026-06-12. Elegí un horario.
```
*(panel con slots: `1. 09:00 AM`, `2. 10:30 AM`, …)*

**Vos:**
```
2
```

**Bot:**
```
Completá los datos del invitado en el panel o decime nombre y email.
```

**Vos:**
```
Carlos Gómez
```

**Bot:**
```
Ahora el email del invitado.
```

**Vos:**
```
carlos@cliente.com
```

**Bot:**
```
**Resumen**
- Tipo: 30 Minute Meeting
- Fecha: 2026-06-12
- Horario: 10:30 AM
- Invitado: Carlos Gómez (carlos@cliente.com)

Escribí confirmar o usá el panel.
```

**Vos:**
```
confirmar
```

**Bot:**
```
✅ Reunión creada: 30 Minute Meeting.
```

---

### Ejemplo 5 — Crear reunión (usando el panel violeta)

Mismo inicio (`agendar reunión`), pero en cada paso hacés clic en el panel en lugar de escribir:

1. Clic en **`1. 30 Minute Meeting`**
2. Elegís fecha en el date picker → **Ver horarios**
3. Clic en un horario, ej. **`3. 02:00 PM`**
4. Completás nombre, email y **preguntas custom** (si el tipo de evento las tiene)
5. Clic en **Agendar reunión**

**Ventaja del panel:** las preguntas obligatorias de Calendly solo se pueden responder bien desde el formulario del panel en el paso `invitee`.

---

### Ejemplo 6 — Crear reunión (texto + panel mezclado)

**Vos:** `programar cita`  
**Vos:** `30 Minute Meeting` *(en lugar del número)*  
**Panel:** elegís la fecha y clic en **Ver horarios**  
**Vos:** `14:30` *(en lugar del número de slot)*  
**Panel:** completás invitado y preguntas → **Agendar reunión**

---

### Ejemplo 7 — Cancelar reunión por ID (rápido)

**Vos:**
```
cancelar reunión #12
```

**Bot:**
```
✅ Reunión #12 cancelada.
```

Otras frases válidas: `eliminar cita 12`, `borrar evento #12`, `cancel meeting #12`.

---

### Ejemplo 8 — Cancelar reunión sin saber el ID

**Vos:**
```
cancelar reunión
```

**Bot:**
```
Decime el ID de la reunión a cancelar.
```
*(panel con lista de reuniones de los próximos 30 días, cada una con botón **Cancelar**)*

**Opción A — por texto:**
```
2
```
*(cancela la reunión en la posición 2 de la lista)*

**Opción B — por panel:**  
Clic en **Cancelar** en la tarjeta de la reunión deseada.

**Bot:**
```
✅ Reunión #15 cancelada.
```

---

### Ejemplo 9 — Reprogramar / reagendar por ID

**Vos:**
```
reprogramar reunión #12
```

**Bot:**
```
Reprogramando reunión #12. Decime la nueva fecha.
```

**Vos:**
```
20/06/2026
```

**Bot:**
```
Fecha 2026-06-20. Elegí un horario.
```

**Vos:** `1` *(o clic en un slot del panel)*

**Bot:**
```
Completá los datos del invitado en el panel o decime nombre y email.
```
*(el panel trae precargados nombre y email del invitado original)*

**Opción A — panel:** ajustás si hace falta → **Reprogramar reunión**

**Opción B — texto:** escribís `confirmar` si no cambiás invitado y el resumen ya está listo.

**Bot:**
```
✅ Reunión actualizada: 30 Minute Meeting.
```

> **Nota:** internamente Calendly cancela la reunión anterior y crea una nueva. El `#id` local puede cambiar tras reprogramar.

---

### Ejemplo 10 — Reprogramar sin ID (elegir de la lista)

**Vos:**
```
editar reunión
```

**Bot:**
```
Decime qué reunión reprogramar.
```
*(panel con reuniones y botones **Reprogramar** / **Cancelar**)*

**Vos:**
```
1
```
*(o clic en **Reprogramar** en la primera reunión del panel)*

**Bot:**
```
Reprogramando reunión #12. Decime la nueva fecha.
```

Seguís como en el ejemplo 9 (fecha → horario → confirmar).

Otras frases de inicio: `modificar cita`, `mover reunión`, `cambiar evento`, `reschedule meeting`.

---

### Ejemplo 11 — Reprogramar solo el horario (mismo día)

**Vos:**
```
reprogramar reunión #12
```

**Vos:**
```
hoy
```

**Vos:** `4` *(cuarto slot disponible)*

**Panel:** **Reprogramar reunión** *(sin cambiar invitado)*

---

### Ejemplo 12 — Consultar y luego cancelar desde la misma lista

**Vos:**
```
mis reuniones
```

**Bot:** *(lista con panel `events_list`)*

**Vos:** *(sin escribir nada más)* → clic **Cancelar** en `#15` en el panel

**Bot:**
```
✅ Reunión #15 cancelada.
```

---

### Ejemplo 13 — Flujo en inglés

**You:**
```
schedule a meeting
```

**Bot:** `Choose the meeting type.`

**You:** `1` → `tomorrow` → `2` → `John Smith` → `john@acme.com` → `confirm`

**Bot:** `✅ Reunión creada: 30 Minute Meeting.`

**You:**
```
today's meetings
```

**You:**
```
cancel meeting #12
```

**You:**
```
reschedule meeting #15
```

---

### Resumen de frases de inicio

| Acción | Español | Inglés |
|--------|---------|--------|
| **Ver reuniones** | `mis reuniones`, `reuniones de hoy`, `agenda de hoy`, `qué tengo hoy` | `today's meetings`, `today's events` |
| **Ver semana** | `agenda de la semana`, `mis reuniones de la semana` | `week's meetings` *(usar mensaje con `week`)* |
| **Crear** | `agendar reunión`, `crear cita`, `programar evento`, `reservar reunión` | `schedule meeting`, `book event` |
| **Cancelar** | `cancelar reunión`, `eliminar cita`, `borrar evento` + opcional `#id` | `cancel meeting`, `delete event` + optional `#id` |
| **Reprogramar** | `reprogramar reunión`, `editar cita`, `mover reunión`, `cambiar evento` + opcional `#id` | `reschedule meeting`, `edit event` + optional `#id` |
| **Confirmar** | `confirmar`, `si`, `sí`, `ok`, `dale`, `listo` | `confirm`, `yes`, `ok` |

### Zona horaria del chatbot

Fija en **`America/Argentina/Buenos_Aires`**. Los horarios del panel se muestran en esa zona. La UI de `/calendario` usa la zona del navegador.

### Preguntas custom en el chatbot

- Se cargan al elegir el tipo de evento.
- **Respondelas en el panel** (paso `invitee`) antes de **Agendar reunión** o **Reprogramar reunión**.
- El flujo solo por texto (nombre → email → confirmar) **no** recorre preguntas obligatorias; si faltan, el backend devuelve error al confirmar.

### Refresh del calendario tras el chatbot

Cuando el chatbot crea, edita o cancela una reunión, emite `epoint:calendly-refresh`. Si tenés `/calendario` abierto, el calendario se actualiza solo en ~90 segundos o al volver a la pestaña.

### Archivos del chatbot

| Archivo | Rol |
|---------|-----|
| `backend/.../calendly_intents.py` | Detecta intenciones por regex |
| `backend/.../calendly_options.py` | Formatea opciones y parsea fechas/horas |
| `backend/.../calendly_actions.py` | Lógica de negocio del chat |
| `frontend/.../ChatCalendlyPanel.tsx` | Panel interactivo en el chat |
| `frontend/.../useChatbot.ts` | `sendCalendlySelection`, refresh del calendario |

---

## 13. API REST (backend)

Prefijo: **`/api/v1/calendly`**  
Autenticación: `Authorization: Bearer {jwt}`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `GET` | `/sales-reps` | Lista vendedores con estado de conexión | `ADMIN` |
| `GET` | `/connection?user_id=` | Estado de conexión | `ADMIN`, `SALES_REP` |
| `POST` | `/connection` | Conectar / actualizar token | `SALES_REP` |
| `DELETE` | `/connection` | Desconectar | `SALES_REP` |
| `POST` | `/sync?user_id=` | Sincronización manual | `ADMIN` (cualquier vendedor), `SALES_REP` (propio) |
| `GET` | `/event-types?user_id=` | Tipos de evento activos | `ADMIN`, `SALES_REP` |
| `GET` | `/event-types/detail?event_type_uri=` | Detalle + preguntas custom | `ADMIN`, `SALES_REP` |
| `GET` | `/available-times?event_type_uri=&start=&end=` | Slots disponibles | `SALES_REP` |
| `GET` | `/events?user_id=&start=&end=` | Eventos locales (+ auto-sync) | `ADMIN`, `SALES_REP` |
| `POST` | `/events` | Crear reunión | `SALES_REP` |
| `PATCH` | `/events/{id}` | Reprogramar reunión | `SALES_REP` |
| `DELETE` | `/events/{id}` | Cancelar reunión | `SALES_REP` |

### Body de creación (`POST /events`)

```json
{
  "event_type_uri": "https://api.calendly.com/event_types/XXXXXXXX",
  "start_time": "2026-06-15T14:30:00.000000Z",
  "invitee_name": "Juan Pérez",
  "invitee_email": "juan@ejemplo.com",
  "timezone": "America/Argentina/Buenos_Aires",
  "questions_and_answers": [
    { "question_uuid": "abc-123", "answer": "Mi respuesta" }
  ]
}
```

### Llamadas internas a Calendly API v2

Implementadas en `backend/app/services/calendly/client.py`:

- `GET /users/me`
- `GET /event_types` (paginado)
- `GET /event_types/{uuid}`
- `GET /event_type_available_times`
- `GET /scheduled_events` (paginado)
- `GET /scheduled_events/{uuid}/invitees`
- `POST /scheduled_events/{uuid}/cancellation`
- `POST /invitees`

---

## 14. Roles y permisos

| Acción | ADMIN | SALES_REP | Otros |
|--------|-------|-----------|-------|
| Ver `/calendario` | ✅ | ✅ | ❌ |
| Listar vendedores | ✅ | ❌ | ❌ |
| Ver calendario de otro vendedor | ✅ | ❌ | ❌ |
| Conectar / desconectar Calendly | ❌ | ✅ | ❌ |
| Sincronizar calendario de otro | ✅ | ❌ | ❌ |
| Crear / editar / cancelar reuniones | ❌ | ✅ (propio) | ❌ |
| Chatbot: gestionar reuniones | ❌ | ✅ | ❌ |
| Chatbot: listar reuniones | ✅* | ✅ | ❌ |

\*El admin solo listaría si tuviera conexión propia; en la práctica no conecta Calendly.

---

## 15. Base de datos

### Migraciones Alembic

| Revisión | Archivo | Cambio |
|----------|---------|--------|
| 011 | `011_calendly_integration.py` | Tablas `calendly_connections` y `calendly_events` |
| 012 | `012_calendly_token_text.py` | Token cifrado: `VARCHAR(1024)` → `TEXT` |
| 013 | `013_calendly_event_type_uri.py` | Columna `event_type_uri` |
| 014 | `014_calendly_invitee_comment.py` | Columna `invitee_comment` |

Ejecutar en el backend:

```bash
alembic upgrade head
```

### Tabla `calendly_connections`

| Columna | Descripción |
|---------|-------------|
| `user_id` | FK → `users.id` (único: 1 conexión por vendedor) |
| `calendly_user_uri` | URI del usuario en Calendly |
| `calendly_user_name` | Nombre en Calendly |
| `calendly_user_slug` | Slug público |
| `scheduling_url` | URL de agendamiento general |
| `access_token_encrypted` | PAT cifrado |
| `last_synced_at` | Última sincronización exitosa |

### Tabla `calendly_events`

| Columna | Descripción |
|---------|-------------|
| `id` | ID local (usado en chat como `#123`) |
| `user_id` | Vendedor dueño del evento |
| `calendly_event_uri` | URI único en Calendly |
| `name` | Nombre del evento |
| `status` | `active` o `canceled` |
| `start_time` / `end_time` | Fechas UTC |
| `event_type_name` / `event_type_uri` | Tipo de reunión |
| `invitee_name` / `invitee_email` | Primer invitado |
| `invitee_comment` | Q&A custom formateadas |
| `location` | Tipo de ubicación |
| `meeting_url` | Link Zoom / Meet / etc. |

---

## 16. Arquitectura de archivos

### Frontend (`src/features/calendly/`)

```
calendly/
├── README.md                          ← esta documentación
├── types.ts                           ← tipos TypeScript
├── hooks/
│   └── useCalendly.ts                 ← estado, API calls, auto-sync
├── components/
│   ├── CalendarioPage.tsx             ← página principal
│   ├── CalendlyCalendarView.tsx       ← FullCalendar
│   ├── CalendlyConnectPanel.tsx       ← panel de conexión inicial
│   ├── CalendlyTokenForm.tsx          ← formulario de token
│   ├── CalendlySettingsModal.tsx      ← actualizar / desconectar token
│   ├── CalendlyActionsMenu.tsx        ← menú de acciones
│   ├── CalendlyEventFormModal.tsx     ← crear / editar reunión
│   ├── CalendlyEventModal.tsx         ← detalle de reunión
│   ├── CalendlyCustomQuestionFields.tsx ← preguntas custom
│   ├── CalendlyShareLink.tsx          ← links públicos
│   └── SalesRepList.tsx               ← lista de vendedores (admin)
└── utils/
    ├── dateRange.ts                   ← rangos de fechas para slots
    └── eventTypesCache.ts             ← caché localStorage de tipos
```

### Frontend — chat

```
src/features/chat/
├── components/ChatCalendlyPanel.tsx     ← panel interactivo del chatbot
├── hooks/useChatbot.ts                ← sendCalendlySelection, refresh
└── types.ts                           ← ChatCalendlyOptions, etc.
```

### Backend

```
backend/app/
├── api/v1/calendly.py                 ← endpoints REST
├── schemas/calendly.py                ← Pydantic schemas
├── models/
│   ├── calendly_connection.py
│   └── calendly_event.py
└── services/
    ├── calendly/
    │   ├── service.py                 ← lógica de negocio
    │   └── client.py                  ← cliente HTTP Calendly API v2
    └── chatbot/
        ├── calendly_actions.py
        ├── calendly_intents.py
        └── calendly_options.py
```

### Ruta Next.js

```
src/app/(dashboard)/calendario/page.tsx  → renderiza <CalendarioPage />
```

---

## 17. Limitaciones conocidas

1. **Sin OAuth ni webhooks** — autenticación solo por PAT manual; detección de reuniones externas por polling/sync.
2. **Un vendedor = una conexión Calendly** — no se comparte token entre usuarios.
3. **Editar = cancelar + crear** — nuevo URI en Calendly; el ID local puede cambiar.
4. **Admin solo lectura** — no gestiona reuniones ni conecta Calendly.
5. **Chatbot no opera calendarios de otros vendedores** — solo el del usuario logueado.
6. **Listado en chatbot: solo hoy o semana** — `agenda de mañana` no filtra por mañana; usar `agenda de la semana`.
7. **Preguntas custom en chat solo vía panel** — el flujo solo-texto no recorre todas las preguntas obligatorias.
8. **Un solo invitado sincronizado** — se toma el primer elemento de `/invitees`.
9. **Tipos `AdhocEventType` excluidos** de la lista de tipos de evento.
10. **Ventana de sync limitada** — 30 días atrás / 180 adelante.
11. **Eventos locales no se purgan** si desaparecen del API de Calendly.
12. **Notificaciones solo in-app** — sin email/WhatsApp para reuniones nuevas.
13. **Notificación solo en syncs posteriores al inicial** — si nadie sincroniza, la notificación tarda hasta el próximo auto-sync.
14. **Horarios pasados del día actual filtrados** — Calendly exige slots futuros.
15. **Timezone del chatbot fija** (Argentina) vs UI (navegador).
16. **Zoom por defecto** — se configura en Calendly (Location del event type), no en código del CRM.
17. **Token expirado** — hay que actualizarlo manualmente en Configuración de Calendly.

---

## 18. Solución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| "No se pudo conectar Calendly" | Token inválido | Generar nuevo PAT en Calendly |
| "El token no tiene permisos de escritura" | Falta scope `scheduled_events:write` | Crear token con ese scope |
| No aparecen tipos de evento | Ningún tipo activo en Calendly | Crear tipos en Calendly |
| "No hay horarios disponibles" | Día sin disponibilidad en Calendly | Elegir otra fecha o revisar disponibilidad en Calendly |
| Reunión creada en Calendly pero no en CRM | No hubo sync aún | Abrir `/calendario` o esperar auto-sync (90 s / 3 min backend) |
| Notificación no llegó al instante | Sync aún no corrió | Abrir calendario o esperar SSE + sync |
| Preguntas custom no aparecen | Caché de tipos desactualizado | Cambiar tipo de evento en el formulario (carga detalle al vuelo) |
| Error 401 de Calendly | Token expirado o revocado | Actualizar en Configuración de Calendly |
| Chatbot no gestiona reuniones | Rol no es `SALES_REP` o sin conexión | Conectar Calendly como vendedor |
| Contador de notificaciones incorrecto | Race SSE + refresh | Debería autocorregirse con sync silencioso |

---

## Referencias rápidas

- [Calendly Developer Docs](https://developer.calendly.com)
- [Personal Access Tokens](https://developer.calendly.com/api-docs/b3A6NTkxNDI0-create-personal-access-token)
- [Scheduled Events API](https://developer.calendly.com/api-docs/2d5ed9bbd2952-list-events)
- [Create Invitee (book meeting)](https://developer.calendly.com/api-docs/p3ghrxrwdr699-create-invitee)
