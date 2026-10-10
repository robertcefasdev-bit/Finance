// Cliente das funções em /api (rodam na Vercel). O login usa cookie HttpOnly.

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { error?: string; message?: string };
  // true quando /api não existe (ex.: `npm run dev` sem `vercel dev`)
  unavailable?: boolean;
}

async function request<T = Record<string, unknown>>(
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, status: response.status, data: {} as ApiResult<T>["data"], unavailable: true };
    }
    return { ok: response.ok, status: response.status, data: data as ApiResult<T>["data"] };
  } catch {
    return { ok: false, status: 0, data: {} as ApiResult<T>["data"], unavailable: true };
  }
}

export const api = {
  me: () => request<{ username: string }>("GET", "/api/me"),
  register: (username: string, phone: string, password: string) =>
    request<{ username: string }>("POST", "/api/register", { username, phone, password }),
  login: (username: string, password: string) =>
    request<{ username: string }>("POST", "/api/login", { username, password }),
  logout: () => request("POST", "/api/logout", {}),
  forgot: (identifier: string) => request("POST", "/api/forgot", { identifier }),
  reset: (token: string, password: string) =>
    request("POST", "/api/reset", { token, password }),
  getState: () => request<{ data: Record<string, unknown> | null }>("GET", "/api/state"),
  saveState: (data: Record<string, unknown>) => request("PUT", "/api/state", { data }),
};
