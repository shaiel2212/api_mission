import { createContext, useContext } from "react";
import type { AuthUser } from "../api/auth";

export type AdminAuthContextValue = {
  user: AuthUser;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside authenticated admin routes");
  }
  return ctx;
}

export { AdminAuthContext };
