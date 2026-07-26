# Reglas — Frontend ePoint CRM

Obligatorias para cualquier agente que modifique este repo.

## Next.js 16

1. No asumir APIs de Next 13/14. Revisar docs en `node_modules/next/dist/docs/` ante dudas.
2. App Router: páginas thin en `src/app/`; lógica en `src/features/<domain>/`.

## Rutas

3. **Toda ruta nueva** debe agregarse a `KNOWN_PATH_PATTERNS` en `src/lib/app-routes.ts` (y quedar cubierta por `middleware.ts`). Si no, redirige a `/`.
4. No inventar páginas huérfanas: registrar también en `appNavigation.ts` si deben aparecer en el menú.

## Auth y multi-tenant

5. Auth es client-side (localStorage). No romper el refresh 401 / logout global.
6. Respetar roles: `CLIENT` solo portal; staff no debe quedarse en `/portal`.
7. Requests staff deben respetar `X-Merchant-Id` vía `MerchantContext`.
8. Para requests en background que no deben forzar logout, usar las opciones existentes (`silentHttpErrors` / `skipAuthRefresh`) con cuidado.

## UI e i18n

9. Strings de UI vía `t("clave")` en `src/i18n/locales/{es,en}.ts`. Si agregás texto, agregalo en **ambos** idiomas.
10. Reutilizar `src/components/ui/*` y tokens de marca (cream/brown/green/gold). No introducir temas purple/glow genéricos.
11. Cards solo cuando aportan interacción; no cardificar el hero/marketing si se toca landing.

## Documentos y dominio

12. En grupos con alternativas (identidad/domicilio), `inferActiveGroupId` debe preferir el grupo **ya resuelto** sobre uno rechazado.
13. Workspace de docs/board del cliente aprobado: respetar helpers de `client-access` / `canViewApprovedClientWorkspace`.

## API y datos

14. Tipos compartidos en `src/types/api.ts`. Mantener alineado con el backend.
15. Query keys centralizadas en `queryKeys.ts`; invalidar de forma coherente al mutar.
16. Pago público (`/pagar/[token]`) usa fetch propio, no el `api` autenticado.

## Env y deploy

17. Variables `NEXT_PUBLIC_*` no cambian en runtime Heroku sin rebuild.
18. App real: `dev-epoint-crm-frontend`. Push: `git push heroku HEAD:main`.
19. No commitear `.env.local`.

## Tests y calidad

20. Matriz de roles/nav: actualizar tests en `tests/unit/` si cambiás permisos o menú.
21. Commits en español, enfocados en el *porqué*.
