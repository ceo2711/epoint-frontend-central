import type { QueryClient } from "@tanstack/react-query";

import {
  markCalendlySync,
  shouldSyncCalendly,
} from "@/features/calendly/utils/syncRegistry";
import { CLIENTS_PAGE_SIZE } from "@/features/clients/hooks/useClients";
import type { PaymentConfig, PaymentLink } from "@/features/payments/types";
import { PROSPECTS_PAGE_SIZE } from "@/features/prospects/hooks/useProspects";
import { getAccessibleHrefs } from "@/lib/appNavigation";
import { api } from "@/lib/api";
import {
  defaultClientsListParams,
  defaultProspectsListParams,
  resolveActiveMerchantId,
} from "@/lib/listDefaults";
import {
  fetchAreas,
  fetchCalendlyConnection,
  fetchCalendlyEventTypes,
  fetchCalendlyEvents,
  fetchCalendlySalesReps,
  fetchClientBoard,
  fetchDashboardMetrics,
  fetchClientsList,
  fetchDocusignConnection,
  fetchDocusignEnvelopes,
  fetchDocusignTemplates,
  fetchInfluencers,
  fetchMerchantOptions,
  fetchMerchants,
  fetchPortalDocuments,
  fetchPortalMe,
  fetchProspectsList,
  fetchRoles,
  fetchSedes,
  fetchSources,
  fetchSubSellerMetrics,
  fetchUsers,
  syncCalendlyEvents,
} from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import {
  canFilterClientsBySalesRep,
  canManageInfluencers,
  canManageSources,
  canSuperviseSalesReps,
  isGlobalAdmin,
  isSalesAreaLeader,
} from "@/lib/roles";
import type { Paginated, User } from "@/types/api";

/** Alineado con el staleTime global del QueryProvider. */
export const PREFETCH_STALE_MS = 5 * 60_000;

const PRIORITY_HREFS = [
  "/calendario",
  "/clientes",
  "/prospectos",
  "/contratos",
  "/pagos",
  "/dashboard",
] as const;

interface PrefetchContext {
  queryClient: QueryClient;
  token: string;
  user: User;
  hasPermission: (permission: string) => boolean;
}

/** Ordena hrefs: ruta actual, luego vistas pesadas, luego el resto. */
export function sortHrefsForPrefetch(hrefs: string[], currentHref?: string): string[] {
  const unique = [...new Set(hrefs)];
  const prioritySet = new Set<string>(PRIORITY_HREFS);
  const current = currentHref
    ? unique.find((item) => currentHref === item || currentHref.startsWith(`${item}/`))
    : undefined;
  const restPriority = PRIORITY_HREFS.filter((href) => unique.includes(href) && href !== current);
  const rest = unique.filter(
    (href) => href !== current && !prioritySet.has(href as (typeof PRIORITY_HREFS)[number]),
  );
  return [...(current ? [current] : []), ...restPriority, ...rest];
}

/**
 * Shell de supervisión: sedes (ADMIN) + vendedores.
 * Es lo primero que piden dashboard/clientes/prospectos/pagos/calendario/contratos
 * antes de elegir sede o rep; sin esto el prefetch de listas no sirve.
 */
async function prefetchSupervisorShell(
  ctx: PrefetchContext,
  options?: { sedes?: boolean; salesReps?: boolean },
) {
  const { queryClient, token, user, hasPermission } = ctx;
  const wantSedes = options?.sedes ?? isGlobalAdmin(user.role.code);
  const wantReps = options?.salesReps ?? true;
  const tasks: Promise<unknown>[] = [];

  if (wantSedes && hasPermission("sedes:read")) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.sedes.list(false),
        queryFn: () => fetchSedes(token, false),
        staleTime: PREFETCH_STALE_MS,
      }),
    );
  }
  if (wantReps) {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.calendly.salesReps,
        queryFn: () => fetchCalendlySalesReps(token),
        staleTime: PREFETCH_STALE_MS,
      }),
    );
  }
  await Promise.allSettled(tasks);
}

async function prefetchCalendlyBundle(ctx: PrefetchContext, userId?: number | null) {
  const { queryClient, token } = ctx;
  const connection = await queryClient.fetchQuery({
    queryKey: queryKeys.calendly.connection(userId),
    queryFn: () => fetchCalendlyConnection(token, userId),
    staleTime: PREFETCH_STALE_MS,
  });

  if (!connection.connected) return;

  // Primero dejamos la cache usable: el sync remoto es la parte lenta y no
  // debe retrasar los datos que la vista necesita para pintar.
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.calendly.events(userId),
      queryFn: () => fetchCalendlyEvents(token, userId),
      staleTime: PREFETCH_STALE_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.calendly.eventTypes(userId),
      queryFn: () => fetchCalendlyEventTypes(token, userId),
      staleTime: PREFETCH_STALE_MS,
    }),
  ]);

  if (!shouldSyncCalendly(userId)) return;
  markCalendlySync(userId);
  try {
    await syncCalendlyEvents(token, userId);
  } catch {
    // Si falla la sync, los eventos locales ya están en cache.
    return;
  }
  // Traer lo que el sync pudo haber agregado, ya con la vista utilizable.
  await queryClient
    .fetchQuery({
      queryKey: queryKeys.calendly.events(userId),
      queryFn: () => fetchCalendlyEvents(token, userId),
      staleTime: 0,
    })
    .catch(() => undefined);
}

async function prefetchDocusignForSalesRep(ctx: PrefetchContext) {
  const { queryClient, token } = ctx;
  const connection = await queryClient.fetchQuery({
    queryKey: queryKeys.docusign.connection,
    queryFn: () => fetchDocusignConnection(token),
    staleTime: PREFETCH_STALE_MS,
  });

  if (!connection.connected) return;

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.docusign.templates,
      queryFn: () => fetchDocusignTemplates(token),
      staleTime: PREFETCH_STALE_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.docusign.envelopes,
      queryFn: () => fetchDocusignEnvelopes(token),
      staleTime: PREFETCH_STALE_MS,
    }),
  ]);
}

async function prefetchRouteData(ctx: PrefetchContext, href: string) {
  const { queryClient, token, user, hasPermission } = ctx;
  const roleCode = user.role.code;
  const isGlobal = isGlobalAdmin(roleCode);
  const canSupervise = canSuperviseSalesReps(user);
  const salesLeader = isSalesAreaLeader(user);
  const merchantId = resolveActiveMerchantId(user);

  switch (href) {
    case "/dashboard": {
      if (!hasPermission("clients:read")) return;

      // ADMIN: primero elige sede; solo prefetcheamos el picker.
      if (isGlobal) {
        await prefetchSupervisorShell(ctx, { sedes: true, salesReps: true });
        return;
      }

      const tasks: Promise<unknown>[] = [];
      if (salesLeader || canSupervise) {
        tasks.push(prefetchSupervisorShell(ctx, { sedes: false, salesReps: true }));
      }
      if (merchantId != null) {
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.dashboard.metrics(merchantId, roleCode, null, null),
            queryFn: () => fetchDashboardMetrics(token),
            staleTime: PREFETCH_STALE_MS,
          }),
        );
      }
      await Promise.allSettled(tasks);
      return;
    }

    case "/clientes": {
      if (!hasPermission("clients:read")) return;
      const params = defaultClientsListParams(user, CLIENTS_PAGE_SIZE);
      const tasks: Promise<unknown>[] = [];

      if (isGlobal || canFilterClientsBySalesRep(user)) {
        tasks.push(
          prefetchSupervisorShell(ctx, {
            sedes: isGlobal,
            salesReps: canFilterClientsBySalesRep(user),
          }),
        );
      }
      if (params.enabled) {
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.clients.list(
              params.onboardingOnly,
              params.page,
              params.pageSize,
              params.search,
              params.merchantFilter,
              params.salesRepId,
              params.sedeId,
            ),
            queryFn: () => fetchClientsList(token, params),
            staleTime: PREFETCH_STALE_MS,
          }),
        );
      }
      if (hasPermission("clients:create") || hasPermission("clients:update")) {
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.merchants.options,
            queryFn: () => fetchMerchantOptions(token),
            staleTime: PREFETCH_STALE_MS,
          }),
        );
      }
      await Promise.allSettled(tasks);
      return;
    }

    case "/prospectos": {
      const params = defaultProspectsListParams(user, PROSPECTS_PAGE_SIZE);
      const tasks: Promise<unknown>[] = [];

      if (isGlobal || canSupervise) {
        tasks.push(
          prefetchSupervisorShell(ctx, {
            sedes: isGlobal,
            salesReps: canSupervise,
          }),
        );
      }
      if (params.enabled) {
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.prospects.list(
              params.page,
              params.pageSize,
              params.search,
              params.statusFilter,
              params.salesRepId,
              params.sedeId,
              params.allMerchants,
            ),
            queryFn: () => fetchProspectsList(token, params),
            staleTime: PREFETCH_STALE_MS,
          }),
        );
      }
      if (hasPermission("prospects:create")) {
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.merchants.options,
            queryFn: () => fetchMerchantOptions(token),
            staleTime: PREFETCH_STALE_MS,
          }),
        );
      }
      await Promise.allSettled(tasks);
      return;
    }

    case "/pagos": {
      if (
        roleCode !== "ADMIN" &&
        roleCode !== "BRANCH_MANAGER" &&
        roleCode !== "SALES_REP" &&
        !(roleCode === "AREA_LEADER" && user.area?.code === "VENTAS")
      ) {
        return;
      }

      // Supervisores: al montar solo el picker (links van por rep).
      if (canSupervise) {
        await prefetchSupervisorShell(ctx, { sedes: isGlobal, salesReps: true });
        return;
      }

      // SALES_REP (incl. sub-seller): config + links propios.
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.payments.links(1, 10),
          queryFn: () =>
            api.get<Paginated<PaymentLink>>("/payments/links?page=1&page_size=10", token),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.payments.config,
          queryFn: () => api.get<PaymentConfig>("/payments/config", token),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.merchants.options,
          queryFn: () => fetchMerchantOptions(token),
          staleTime: PREFETCH_STALE_MS,
        }),
      ]);
      return;
    }

    case "/calendario": {
      if (roleCode === "SALES_REP") {
        await prefetchCalendlyBundle(ctx, user.id);
        return;
      }
      if (canSupervise) {
        // Vista empieza en picker; no prefetchear el bundle del primer rep.
        await prefetchSupervisorShell(ctx, { sedes: isGlobal, salesReps: true });
      }
      return;
    }

    case "/contratos": {
      if (canSupervise) {
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: queryKeys.docusign.connection,
            queryFn: () => fetchDocusignConnection(token),
            staleTime: PREFETCH_STALE_MS,
          }),
          prefetchSupervisorShell(ctx, { sedes: isGlobal, salesReps: true }),
        ]);
        return;
      }
      if (roleCode === "SALES_REP") {
        await prefetchDocusignForSalesRep(ctx);
      }
      return;
    }

    case "/equipo":
      if (roleCode !== "SALES_REP" || user.is_sub_seller) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.subSellers.metrics(user.id),
        queryFn: () => fetchSubSellerMetrics(token),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/fuentes":
      if (!canManageSources(roleCode) || !hasPermission("sources:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.sources.list(true),
        queryFn: () => fetchSources(token, true),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/influencers":
      if (!canManageInfluencers(user)) return;
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.influencers.list(true),
          queryFn: () => fetchInfluencers(token, true),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.calendly.salesReps,
          queryFn: () => fetchCalendlySalesReps(token),
          staleTime: PREFETCH_STALE_MS,
        }),
      ]);
      return;

    case "/usuarios": {
      // Líder de ventas: vista de equipo, no el listado de usuarios.
      if (salesLeader) {
        const tasks: Promise<unknown>[] = [
          queryClient.prefetchQuery({
            queryKey: queryKeys.calendly.salesReps,
            queryFn: () => fetchCalendlySalesReps(token),
            staleTime: PREFETCH_STALE_MS,
          }),
        ];
        if (hasPermission("clients:read") && merchantId != null) {
          tasks.push(
            queryClient.prefetchQuery({
              queryKey: queryKeys.dashboard.metrics(merchantId, roleCode, null, null),
              queryFn: () => fetchDashboardMetrics(token),
              staleTime: PREFETCH_STALE_MS,
            }),
          );
        }
        await Promise.allSettled(tasks);
        return;
      }

      if (!hasPermission("users:read")) return;
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.users.list(),
          queryFn: () => fetchUsers(token),
          staleTime: PREFETCH_STALE_MS,
        }),
        hasPermission("roles:read")
          ? queryClient.prefetchQuery({
              queryKey: queryKeys.roles.list,
              queryFn: () => fetchRoles(token),
              staleTime: PREFETCH_STALE_MS,
            })
          : Promise.resolve(),
        hasPermission("areas:read")
          ? queryClient.prefetchQuery({
              queryKey: queryKeys.areas.list,
              queryFn: () => fetchAreas(token),
              staleTime: PREFETCH_STALE_MS,
            })
          : Promise.resolve(),
        hasPermission("sedes:read")
          ? queryClient.prefetchQuery({
              queryKey: queryKeys.sedes.list(false),
              queryFn: () => fetchSedes(token, false),
              staleTime: PREFETCH_STALE_MS,
            })
          : Promise.resolve(),
      ]);
      return;
    }

    case "/sedes":
      if (!hasPermission("sedes:create") && !hasPermission("sedes:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.sedes.list(true),
        queryFn: () => fetchSedes(token, true),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/comercios":
      if (!hasPermission("merchants:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.merchants.list(true),
        queryFn: () => fetchMerchants(token, true),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/roles":
      if (!hasPermission("roles:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.roles.list,
        queryFn: () => fetchRoles(token),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/portal":
    case "/portal/datos":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.portal.me,
        queryFn: () => fetchPortalMe(token),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/portal/documentos":
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.portal.me,
          queryFn: () => fetchPortalMe(token),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.portal.documents,
          queryFn: () => fetchPortalDocuments(token),
          staleTime: PREFETCH_STALE_MS,
        }),
      ]);
      return;

    case "/portal/tablero":
      if (user.client_id) {
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: queryKeys.portal.me,
            queryFn: () => fetchPortalMe(token),
            staleTime: PREFETCH_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.boards.client(user.client_id),
            queryFn: () => fetchClientBoard(token, user.client_id!),
            staleTime: PREFETCH_STALE_MS,
          }),
        ]);
      }
      return;

    default:
      return;
  }
}

export async function prefetchAppData(
  queryClient: QueryClient,
  token: string,
  user: User,
  hasPermission: (permission: string) => boolean,
  options?: { skipHref?: string; currentPathname?: string },
) {
  const hrefs = getAccessibleHrefs(user, hasPermission, {
    // Si el cliente tiene board, prefetcheamos tablero aunque el nav lo oculte
    // hasta desbloquear; los datos quedan listos al abrir.
    boardUnlocked: user.role.code === "CLIENT" && !!user.client_id,
  }).filter((href) => href !== options?.skipHref);
  const ordered = sortHrefsForPrefetch(hrefs, options?.currentPathname);
  const ctx: PrefetchContext = { queryClient, token, user, hasPermission };
  await Promise.allSettled(
    ordered.map((href) => prefetchRouteData(ctx, href).catch(() => undefined)),
  );
}

export async function prefetchCurrentRouteData(
  queryClient: QueryClient,
  token: string,
  user: User,
  hasPermission: (permission: string) => boolean,
  pathname: string,
) {
  const href = getAccessibleHrefs(user, hasPermission, {
    boardUnlocked: user.role.code === "CLIENT" && !!user.client_id,
  }).find((item) => pathname === item || pathname.startsWith(`${item}/`));
  if (!href) return;
  await prefetchRouteData({ queryClient, token, user, hasPermission }, href);
}
