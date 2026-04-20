import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authLogout } from "../api/auth";
import { useAdminAuth } from "../admin/AdminAuthContext";
import AdminLeadsPanel from "../components/admin/AdminLeadsPanel";
import AdminProjectsPanel from "../components/admin/AdminProjectsPanel";
import MarketingDashboardPage from "./MarketingDashboardPage";

type Tab = "leads" | "projects" | "marketing";

function parseTab(raw: string | null): Tab {
  if (raw === "projects" || raw === "marketing") {
    return raw;
  }
  return "leads";
}

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const { user, refresh } = useAdminAuth();
  const navigate = useNavigate();
  const canCms = user.role === "admin" || user.role === "manager";

  const setTab = (t: Tab) => {
    if (t === "leads") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: t }, { replace: true });
    }
  };

  useEffect(() => {
    if (!canCms && (tab === "projects" || tab === "marketing")) {
      setSearchParams({}, { replace: true });
    }
  }, [canCms, tab, setSearchParams]);

  async function logout() {
    try {
      await authLogout();
    } finally {
      await refresh();
      navigate("/admin/login", { replace: true });
    }
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className={[
        "rounded px-4 py-2 text-sm font-bold transition-colors",
        tab === t ? "bg-gold text-black" : "border border-white/20 text-gray-200 hover:border-gold/50",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-24 text-white">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black">מרכז ניהול</h1>
          <p className="mt-1 text-sm text-gray-400">
            {user.fullName} · {user.email} · {user.role}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded border border-white/25 px-4 py-2 text-sm font-bold text-gray-200 hover:bg-white/5"
        >
          התנתק
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {tabBtn("leads", "לידים")}
        {canCms ? tabBtn("projects", "פרויקטים") : null}
        {canCms ? tabBtn("marketing", "שיווק ואינטגרציות") : null}
      </div>

      {tab === "leads" ? <AdminLeadsPanel /> : null}
      {tab === "projects" && canCms ? <AdminProjectsPanel /> : null}
      {tab === "marketing" && canCms ? <MarketingDashboardPage embedded /> : null}
    </section>
  );
}
