# Epoint CRM — Frontend (Next.js)

Aplicación web del CRM. Diseñada para desplegarse como app Heroku independiente del backend.

## Requisitos

- Node.js 20+
- Backend API corriendo (ver `../backend`)

## Inicio rápido (local)

```bash
npm install
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL si el backend no está en localhost:8000

npm run dev
```

Abrir http://localhost:3000

**Credenciales de prueba** (tras ejecutar seed del backend):
- Email: `admin@epoint.com`
- Contraseña: `Admin123!`

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL base de la API FastAPI (ej. `http://localhost:8000/api/v1`) |

## Heroku

```bash
heroku create epoint-crm-web
heroku config:set NEXT_PUBLIC_API_URL=https://epoint-crm-api.herokuapp.com/api/v1
git push heroku main
```

## Estructura

```
src/
├── app/              # Rutas (App Router)
│   ├── login/
│   └── (dashboard)/  # Panel backoffice
├── components/       # UI reutilizable
├── contexts/         # Auth
├── lib/              # Cliente API
└── types/            # Tipos TypeScript
```
