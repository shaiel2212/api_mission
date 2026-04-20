import { apiUrl } from "../config/apiBase";
import { getCsrfTokenFromCookie, buildCsrfHeaders } from "../lib/csrf";
import { readJsonBody } from "./readJsonBody";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "manager" | "agent";
};

type MeResponse = { status: "success"; user: AuthUser | null; traceId?: string };
type LoginResponse = { status: "success"; user: AuthUser; traceId?: string };
type ApiError = { status: "error"; code?: string; message?: string };

const cred: RequestInit = { credentials: "include" };

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await readJsonBody(res)) as T | ApiError;
  if (!res.ok || (data as ApiError).status === "error") {
    const err = data as ApiError;
    throw new Error(err.message || "שגיאת התחברות");
  }
  return data as T;
}

export async function authMe(): Promise<AuthUser | null> {
  const res = await fetch(apiUrl("/api/auth/me"), cred);
  const data = await parseJson<MeResponse>(res);
  return data.user ?? null;
}

export async function authLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(apiUrl("/api/auth/login"), {
    ...cred,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await parseJson<LoginResponse>(res);
  return data.user;
}

export async function authLogout(): Promise<void> {
  const t = getCsrfTokenFromCookie();
  if (!t) {
    const pre = await fetch(apiUrl("/api/auth/me"), cred);
    if (pre.ok) {
      await readJsonBody(pre);
    }
  }
  const res = await fetch(apiUrl("/api/auth/logout"), {
    ...cred,
    method: "POST",
    headers: { ...buildCsrfHeaders() },
  });
  await parseJson<{ status: string }>(res);
}
