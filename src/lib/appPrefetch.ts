import type { QueryClient } from "@tanstack/react-query";

import { getAccessibleHrefs } from "@/lib/appNavigation";
import {
  fetchAreas,
  fetchCalendlyConnection,
  fetchCalendlyEventTypes,
  fetchCalendlyEvents,
  fetchCalendlySalesReps,
  fetchClientBoard,
  fetchClientStats,
  fetchClientsList,
  fetchDocusignConnection,
  fetchDocusignEnvelopes,
  fetchDocusignTemplates,
  fetchMerchantOptions,
  fetchMerchants,
  fetchPortalDocuments,
  fetchPortalMe,
  fetchRoles,
  fetchUsers,
} from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { User } from "@/types/api";

const PREFETCH_STALE_MS = 60_000;

interface PrefetchContext {
  queryClient: QueryClient;
  token: string;
  user: User;
  hasPermission: (permission: string) => boolean;
}

async function prefetchCalendlyBundle(ctx: PrefetchContext, userId?: number | null) {
  const { queryClient, token } = ctx;
  const connection = await queryClient.fetchQuery({
    queryKey: queryKeys.calendly.connection(userId),
    queryFn: () => fetchCalendlyConnection(token, userId),
    staleTime: PREFETCH_STALE_MS,
  });

  if (!connection.connected) return;

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
}

async function prefetchDocusignBundle(ctx: PrefetchContext) {
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

  switch (href) {
    case "/dashboard":
      if (hasPermission("clients:read")) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.clients.stats,
          queryFn: () => fetchClientStats(token),
          staleTime: PREFETCH_STALE_MS,
        });
      }
      return;

    case "/clientes":
      if (!hasPermission("clients:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.clients.list(roleCode === "ONBOARDING_MANAGER", 1, 10),
        queryFn: () =>
          fetchClientsList(token, {
            onboardingOnly: roleCode === "ONBOARDING_MANAGER",
            page: 1,
            pageSize: 10,
          }),
        staleTime: PREFETCH_STALE_MS,
      });
      if (hasPermission("clients:create") || hasPermission("clients:update")) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.merchants.options,
          queryFn: () => fetchMerchantOptions(token),
          staleTime: PREFETCH_STALE_MS,
        });
      }
      return;

    case "/calendario":
      if (roleCode === "SALES_REP") {
        await prefetchCalendlyBundle(ctx, user.id);
        return;
      }
      if (roleCode === "ADMIN") {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.calendly.salesReps,
          queryFn: () => fetchCalendlySalesReps(token),
          staleTime: PREFETCH_STALE_MS,
        });
      }
      return;

    case "/contratos":
      await prefetchDocusignBundle(ctx);
      return;

    case "/usuarios":
      if (!hasPermission("users:read")) return;
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.users.list,
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
      ]);
      return;

    case "/comercios":
      if (!hasPermission("merchants:create")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.merchants.list(true),
        queryFn: () => fetchMerchants(token, true),
        staleTime: PREFETCH_STALE_MS,
      });
      return;

    case "/areas":
      if (!hasPermission("areas:read")) return;
      await queryClient.prefetchQuery({
        queryKey: queryKeys.areas.list,
        queryFn: () => fetchAreas(token),
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
        await queryClient.prefetchQuery({
          queryKey: queryKeys.boards.client(user.client_id),
          queryFn: () => fetchClientBoard(token, user.client_id!),
          staleTime: PREFETCH_STALE_MS,
        });
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
) {
  const hrefs = getAccessibleHrefs(user, hasPermission);
  await Promise.allSettled(hrefs.map((href) => prefetchRouteData({ queryClient, token, user, hasPermission }, href)));
}
