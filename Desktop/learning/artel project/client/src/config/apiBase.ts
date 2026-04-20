/**
 * Base URL for API calls (no trailing slash).
 * Leave empty in dev when Vite `server.proxy` forwards `/api` to the backend.
 * Set to `http://127.0.0.1:3001` for `vite preview` without proxy, or your production API origin.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw || typeof raw !== "string") {
    return "";
  }
  return raw.trim().replace(/\/$/, "");
}

/** Build absolute or same-origin URL for fetch(). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    return p;
  }
  return `${base}${p}`;
}
