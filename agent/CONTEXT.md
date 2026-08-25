# Contexto — Frontend ePoint CRM

Repo git independiente: `https://github.com/ceo2711/epoint-frontend-central.git`

| Ambiente | App Heroku | Remote git | URL |
|----------|------------|------------|-----|
| Dev | `dev-epoint-crm-frontend` | `heroku` | `https://dev-epoint-crm-frontend-4985af85e0a2.herokuapp.com` |
| Prod | `epoint-crm-frontend` | `heroku-prod` | `https://epoint-crm-frontend-8a88c1924ab8.herokuapp.com` |

## Estado actual (ago 2026)

- Rama de cursos/mentorías: `feature/cursos-mentorias`. **No** desplegar sobre `release/1.0.0` (store / prod).
- Portal cliente: tres áreas con lock por entitlement — Asesoría (`credit`), Cursos (`course`), Mentorías (`mentorship`). Gate: `PortalProductGate` + `ProductLockScreen`.
- Staff: `/cursos` (permiso `courses:manage`) para cargar/publicar videos. Player del cliente: `/portal/cursos`. Mentoría Calendly en `/portal/mentorias` **pendiente**.
- `User.entitlements` viene de `/auth/me`. Sin `CREDIT` no hay onboarding/tablero aunque el portal esté activo por curso.
- Cuenta App Review `appreview@epoint.com`: `src/lib/app-review.ts` — no exigir 2FA ni cambio de password en UI. No usar `guaniquediaz@gmail.com` ni otras cuentas con TOTP en Notes de Apple.
- No hay IAP. Los cobros son `/pagar/[token]` del CRM. La landing (otro repo) redirige ahí tras el checkout público.
- Next 16: no asumir APIs de 13/14.

## Stack

- Next.js **16** (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4
- TanStack React Query 5 · dnd-kit · FullCalendar · Recharts · Vitest
- Alias `@/*` → `./src/*` · Node 20.x / npm 10.x

> Next 16 tiene breaking changes respecto a 13/14. Antes de APIs nuevas, consultá `node_modules/next/dist/docs/`.

## Arranque

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
npm test
```

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | Base FastAPI (default `http://localhost:8000/api/v1`) |
| `NEXT_PUBLIC_CALENDLY_WRITE_ENABLED` | `"true"` para writes Calendly |

Seed: `admin@epoint.com` / `Admin123!`

## Estructura

```
src/
  app/
    (auth)/          # login, 2FA, recuperar/cambiar password
    (dashboard)/     # backoffice staff (+ /cursos staff)
    portal/          # portal CLIENT (+ /cursos player, /mentorias)
    pagar/[token]/  # pago público
  components/        # UI + shell
  contexts/          # Language, Merchant, Modal, Shell
  features/          # dominio por carpeta
  i18n/              # es.ts / en.ts + translate()
  lib/               # api, queryKeys, roles, routes, appNavigation
  types/api.ts
middleware.ts        # allowlist de rutas conocidas
emails/              # react-email
```

### Features (`src/features/`)

`auth`, `boards`, `calendly`, `chat`, `clients`, `courses`, `dashboard`, `documents`, `docusign`, `emails`, `influencers`, `merchants`, `notifications`, `payments`, `portal`, `prospects`, `roles`, `sedes`, `sources`, `users`, `areas`

## Auth y roles

- Tokens en localStorage (`epoint_access_token`, refresh, temp 2FA)
- `AuthContext` + refresh en 401 (`lib/api.ts`)
- `CLIENT` → `/portal`; resto → `/dashboard`
- Multi-comercio: `MerchantContext` → header `X-Merchant-Id`
- Nav filtrada: `lib/appNavigation.ts` + permisos + `entitlement` (portal)
- App Review: `isAppReviewEmail` saltea 2FA / must_change_password en UI

## Flujos importantes

| Flujo | Dónde |
|-------|--------|
| Login / 2FA / password | `app/(auth)/`, `features/auth/` |
| Portal cliente | `/portal`, `/portal/datos|documentos|tablero|cuenta|cursos|mentorias` (locks por entitlement) |
| Cursos staff | `/cursos` — `features/courses/` |
| Clientes + onboarding | `features/clients/`, detalle en `(dashboard)/clientes/[id]` |
| Documentos IA | `features/documents/` — `inferActiveGroupId` prioriza alternativa resuelta |
| Board Kanban | `features/boards/` |
| Pagos staff + público | `/pagos`, `/pagar/[token]` |
| Chatbot | `features/chat/FloatingChatWidget` |
| i18n | `useTranslation()`; locale en `localStorage` (`epoint-crm-locale`) |

## API client

- `src/lib/api.ts`: `get/post/patch/put/delete/upload`
- React Query: `queryKeys.ts` + `queryFetchers.ts`
- Errores: `ApiError`, `getUserFacingErrorMessage`

## Deploy Heroku

```bash
git push origin HEAD
git push heroku HEAD:main        # SOLO dev
# git push heroku-prod HEAD:main # SOLO si se pide prod
```

- **No desplegar** `feature/cursos-mentorias` a prod/`release/1.0.0` salvo pedido explícito.

- `Procfile`: `web: npm run start`
- `heroku-postbuild`: `npm run build`
- **`NEXT_PUBLIC_*` se embebe en build** — setear config vars antes del deploy

## Design

Tokens en `globals.css`: cream / brown / green / gold. Fuente Google Sans + Geist Mono.
