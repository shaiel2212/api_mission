import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin, authMe } from "../api/auth";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const u = await authMe();
      if (!cancelled && u) {
        navigate("/admin", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authLogin(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "התחברות נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 pb-20 pt-28 text-white">
      <h1 className="mb-2 text-2xl font-black">כניסת מנהלים</h1>
      <p className="mb-8 text-sm text-gray-400">הזינו אימייל וסיסמה של משתמש פעיל במערכת.</p>
      {error ? <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">{error}</p> : null}
      <form className="space-y-4 rounded border border-white/15 bg-black/50 p-6" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="mb-1 block text-sm text-gray-300">אימייל</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300">סיסמה</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gold py-3 font-bold text-black disabled:opacity-60"
        >
          {loading ? "מתחבר…" : "התחבר"}
        </button>
      </form>
    </section>
  );
}
