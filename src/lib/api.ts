import { notifyUnauthorized } from "@/features/auth/auth-unauthorized";
import { refreshAccessToken } from "@/features/auth/auth-session";
import { ApiError } from "@/lib/api-error";
import { getApiBaseUrl } from "@/lib/api-config";
import { logClientError, NETWORK_ERROR_MESSAGE } from "@/lib/user-facing-error";

const API_URL = getApiBaseUrl();

export { ApiError, isUnauthorizedError } from "@/lib/api-error";

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRefresh?: boolean;
  /** No registrar en consola errores HTTP esperados (p. ej. sync en background). */
  silentHttpErrors?: boolean;
};

let activeMerchantIdProvider: () => number | null = () => null;

export function setActiveMerchantIdProvider(provider: () => number | null) {
  activeMerchantIdProvider = provider;
}

function merchantHeaders(): Record<string, string> {
  const merchantId = activeMerchantIdProvider();
  return merchantId ? { "X-Merchant-Id": String(merchantId) } : {};
}

function throwNetworkError(method: string, path: string, cause: unknown): never {
  logClientError("api:network", cause, { method, path, baseUrl: API_URL });
  throw new ApiError(0, NETWORK_ERROR_MESSAGE);
}

/** 4xx de formularios de auth: la UI ya muestra el mensaje; no spamear la consola. */
const SILENT_AUTH_CLIENT_PATHS = new Set([
  "/auth/login",
  "/auth/2fa/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/change-password",
]);

function shouldLogHttpError(path: string, status: number, silentHttpErrors?: boolean): boolean {
  if (silentHttpErrors) return false;
  if (status >= 400 && status < 500 && SILENT_AUTH_CLIENT_PATHS.has(path)) {
    return false;
  }
  // Validaciones de negocio: la UI ya muestra el mensaje (modal/toast). No spamear consola.
  if (status === 400 || status === 409 || status === 422) {
    return false;
  }
  return true;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { token, skipAuthRefresh, silentHttpErrors, headers, ...rest } = options;
  const method = rest.method ?? "GET";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...merchantHeaders(),
        ...headers,
      },
    });
  } catch (cause) {
    throwNetworkError(method, path, cause);
  }

  if (!response.ok) {
    let message = "Error en la solicitud";
    try {
      const data = await response.json();
      const detail = data.detail ?? data.message;
      if (Array.isArray(detail)) {
        message = detail.map((e: { msg?: string }) => e.msg ?? String(e)).join(", ");
      } else if (detail) {
        message = String(detail);
      }
    } catch {
      message = response.statusText || message;
    }
    if (response.status === 401 && token && !isRetry && !skipAuthRefresh) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, { ...options, token: newToken }, true);
      }
    }
    if (response.status === 401 && token) {
      notifyUnauthorized();
    }
    if (shouldLogHttpError(path, response.status, silentHttpErrors)) {
      logClientError("api:http", message, { method, path, status: response.status });
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface BlobResponse {
  data: ArrayBuffer;
  mimeType: string;
}

async function requestBlob(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<BlobResponse> {
  const { token, skipAuthRefresh, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...merchantHeaders(),
        ...headers,
      },
    });
  } catch (cause) {
    throwNetworkError("GET", path, cause);
  }

  if (!response.ok) {
    let message = "Error en la solicitud";
    try {
      const data = await response.json();
      const detail = data.detail ?? data.message;
      if (Array.isArray(detail)) {
        message = detail.map((e: { msg?: string }) => e.msg ?? String(e)).join(", ");
      } else if (detail) {
        message = String(detail);
      }
    } catch {
      message = response.statusText || message;
    }
    if (response.status === 401 && token && !isRetry && !skipAuthRefresh) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return requestBlob(path, { ...options, token: newToken }, true);
      }
    }
    if (response.status === 401 && token) {
      notifyUnauthorized();
    }
    logClientError("api:http", message, { method: "GET", path, status: response.status });
    throw new ApiError(response.status, message);
  }

  const mimeType =
    response.headers.get("Content-Type")?.split(";")[0]?.trim() || "application/octet-stream";
  const data = await response.arrayBuffer();
  return { data, mimeType };
}

async function uploadRequest<T>(
  path: string,
  formData: FormData,
  token?: string | null,
  isRetry = false,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...merchantHeaders(),
      },
      body: formData,
    });
  } catch (cause) {
    throwNetworkError("POST", path, cause);
  }

  if (!response.ok) {
    let message = "Error en la solicitud";
    try {
      const data = await response.json();
      const detail = data.detail ?? data.message;
      if (Array.isArray(detail)) {
        message = detail.map((e: { msg?: string }) => e.msg ?? String(e)).join(", ");
      } else if (detail) {
        message = String(detail);
      }
    } catch {
      message = response.statusText || message;
    }
    if (response.status === 401 && token && !isRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return uploadRequest<T>(path, formData, newToken, true);
      }
    }
    if (response.status === 401 && token) {
      notifyUnauthorized();
    }
    logClientError("api:http", message, { method: "POST", path, status: response.status });
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  getBlob: (path: string, token?: string | null) =>
    requestBlob(path, { token }),

  post: <T>(
    path: string,
    body: unknown,
    token?: string | null,
    options?: Pick<RequestOptions, "silentHttpErrors" | "skipAuthRefresh">,
  ) => request<T>(path, { method: "POST", body: JSON.stringify(body), token, ...options }),

  upload: <T>(path: string, formData: FormData, token?: string | null) =>
    uploadRequest<T>(path, formData, token),

  patch: <T>(
    path: string,
    body: unknown,
    token?: string | null,
    options?: Pick<RequestOptions, "silentHttpErrors" | "skipAuthRefresh">,
  ) => request<T>(path, { method: "PATCH", body: JSON.stringify(body), token, ...options }),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export { API_URL };
export { getUserFacingErrorMessage, NETWORK_ERROR_MESSAGE } from "@/lib/user-facing-error";
