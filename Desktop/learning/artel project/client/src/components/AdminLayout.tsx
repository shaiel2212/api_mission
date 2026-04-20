import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authMe } from "../api/auth";
import type { AuthUser } from "../api/auth";
import { AdminAuthContext } from "../admin/AdminAuthContext";

function AdminSeo() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <title>ניהול | ארטל בניה ופיתוח</title>
    </Helmet>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-400" aria-busy="true">
      טוען…
    </div>
  );
}

/** מעטפת לנתיבי `/admin/*` — הגנת סשן ו־`<Outlet />`. */
export default function AdminLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/admin/login";
  const [me, setMe] = useState<{ user: AuthUser | null; loading: boolean }>({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const user = await authMe();
      setMe({ user, loading: false });
    } catch {
      setMe({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [location.pathname, refresh]);

  if (!isLogin && me.loading) {
    return (
      <>
        <AdminSeo />
        <PageLoader />
      </>
    );
  }

  if (!isLogin && !me.user) {
    return (
      <>
        <AdminSeo />
        <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
      </>
    );
  }

  if (isLogin) {
    return (
      <>
        <AdminSeo />
        <Outlet context={{ refresh }} />
      </>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ user: me.user as AuthUser, refresh }}>
      <AdminSeo />
      <Outlet />
    </AdminAuthContext.Provider>
  );
}
