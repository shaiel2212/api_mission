import { getCsrfTokenFromCookie, buildCsrfHeaders } from "../lib/csrf";

/**
 * כותרות לבקשות אדמין עם עוגיית סשן (`credentials: "include"`) + CSRF double-submit.
 */
export function adminJsonHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getCsrfTokenFromCookie();
  if (t) {
    h["X-CSRF-Token"] = t;
  }
  return h;
}

export function adminReadHeaders(): HeadersInit {
  return { ...buildCsrfHeaders() };
}

export function withCredentials(init: RequestInit = {}): RequestInit {
  return { ...init, credentials: "include" };
}

export function withCsrfAndCredentials(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: "include",
    headers: {
      ...buildCsrfHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  };
}
