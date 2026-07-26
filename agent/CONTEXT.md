# Contexto — Frontend ePoint CRM

Repo git independiente. App Heroku: **`dev-epoint-crm-frontend`**.  
URL: `https://dev-epoint-crm-frontend-4985af85e0a2.herokuapp.com`

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
    (dashboard)/     # backoffice staff
    portal/          # portal CLIENT
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

`auth`, `boards`, `calendly`, `chat`, `clients`, `dashboard`, `documents`, `docusign`, `emails`, `influencers`, `merchants`, `notifications`, `payments`, `portal`, `prospects`, `roles`, `sedes`, `sources`, `users`, `areas`

## Auth y roles

- Tokens en localStorage (`epoint_access_token`, refresh, temp 2FA)
- `AuthContext` + refresh en 401 (`lib/api.ts`)
- `CLIENT` → `/portal`; resto → `/dashboard`
- Multi-comercio: `MerchantContext` → header `X-Merchant-Id`
- Nav filtrada: `lib/appNavigation.ts` + permisos

## Flujos importantes

| Flujo | Dónde |
|-------|--------|
| Login / 2FA / password | `app/(auth)/`, `features/auth/` |
| Portal cliente | `/portal`, `/portal/datos|documentos|tablero|cuenta` |
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
git push heroku HEAD:main   # remote: https://git.heroku.com/dev-epoint-crm-frontend.git
```

- `Procfile`: `web: npm run start`
- `heroku-postbuild`: `npm run build`
- **`NEXT_PUBLIC_*` se embebe en build** — setear config vars antes del deploy

## Design

Tokens en `globals.css`: cream / brown / green / gold. Fuente Google Sans + Geist Mono.
