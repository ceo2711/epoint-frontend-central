import { notifyUnauthorized } from "@/features/auth/auth-unauthorized";
import { refreshAccessToken } from "@/features/auth/auth-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRefresh?: boolean;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { token, skipAuthRefresh, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor. Verificá que el backend esté corriendo (${API_URL}).`,
    );
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
    if (response.status === 401) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function requestBlob(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<ArrayBuffer> {
  const { token, skipAuthRefresh, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor. Verificá que el backend esté corriendo (${API_URL}).`,
    );
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
    if (response.status === 401) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, message);
  }

  return response.arrayBuffer();
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
      },
      body: formData,
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor. Verificá que el backend esté corriendo (${API_URL}).`,
    );
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
    if (response.status === 401) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  getBlob: (path: string, token?: string | null) =>
    requestBlob(path, { token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), token }),

  upload: <T>(path: string, formData: FormData, token?: string | null) =>
    uploadRequest<T>(path, formData, token),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export { API_URL };
