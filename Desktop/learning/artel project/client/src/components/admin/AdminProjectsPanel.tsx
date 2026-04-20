import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  type ProjectCategory,
  type ProjectPayload,
  type ProjectRecord,
} from "../../api/projects";

type Category = "all" | "renovation" | "office" | "construction";

const filters: { key: Category; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "renovation", label: "שיפוץ יוקרה" },
  { key: "office", label: "משרדים" },
  { key: "construction", label: "בניה פרטית" },
];

const emptyForm: ProjectPayload = {
  title: "",
  category: "renovation",
  subtitle: "",
  year: `${new Date().getFullYear()}`,
  location: "",
  image: "",
  modalImage: "",
  beforeImage: "",
  afterImage: "",
  description: "",
  featuredOnHome: false,
  areaLabel: "",
  architect: "",
};

export default function AdminProjectsPanel() {
  const [cat, setCat] = useState<Category>("all");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [form, setForm] = useState<ProjectPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    try {
      const items = await listProjects();
      setProjects(items);
    } catch (e) {
      setStatusMessage((e as Error).message || "נכשלה טעינת הפרויקטים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const list = useMemo(
    () => (cat === "all" ? projects : projects.filter((p) => p.category === cat)),
    [cat, projects]
  );

  const onFieldChange = (field: keyof ProjectPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage("");
    try {
      if (editingId) {
        await updateProject(editingId, form);
        setStatusMessage("הפרויקט עודכן בהצלחה.");
      } else {
        await createProject(form);
        setStatusMessage("הפרויקט נוסף בהצלחה.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setStatusMessage((err as Error).message || "שמירת הפרויקט נכשלה.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (project: ProjectRecord) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      category: project.category,
      subtitle: project.subtitle,
      year: project.year,
      location: project.location,
      image: project.image,
      modalImage: project.modalImage,
      beforeImage: project.beforeImage,
      afterImage: project.afterImage,
      description: project.description || "",
      featuredOnHome: project.featuredOnHome,
      areaLabel: project.areaLabel ?? "",
      architect: project.architect ?? "",
    });
  };

  const onDelete = async (id: number) => {
    if (!window.confirm("למחוק את הפרויקט?")) {
      return;
    }
    try {
      await deleteProject(id);
      setStatusMessage("הפרויקט נמחק.");
      await loadProjects();
    } catch (err) {
      setStatusMessage((err as Error).message || "מחיקת הפרויקט נכשלה.");
    }
  };

  return (
    <div className="text-white">
      <h2 className="mb-2 text-2xl font-black">ניהול פרויקטים</h2>
      <p className="mb-6 text-sm text-gray-400">הוספה, עריכה ומחיקה — מוצג באתר הציבורי לאחר השמירה.</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mb-10 grid gap-4 rounded-2xl border border-white/10 bg-darkGray/60 p-6 md:grid-cols-2">
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="כותרת"
          value={form.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          required
        />
        <select
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          value={form.category}
          onChange={(e) => onFieldChange("category", e.target.value as ProjectCategory)}
        >
          <option value="renovation">שיפוץ יוקרה</option>
          <option value="office">משרדים</option>
          <option value="construction">בניה פרטית</option>
        </select>
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="כותרת משנה"
          value={form.subtitle}
          onChange={(e) => onFieldChange("subtitle", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="שנה (לדוגמה 2026)"
          value={form.year}
          onChange={(e) => onFieldChange("year", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="מיקום"
          value={form.location}
          onChange={(e) => onFieldChange("location", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="היקף (לדוגמה 250 מ״ר) — אופציונלי"
          value={form.areaLabel ?? ""}
          onChange={(e) => onFieldChange("areaLabel", e.target.value)}
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="אדריכל/סטודיו — אופציונלי"
          value={form.architect ?? ""}
          onChange={(e) => onFieldChange("architect", e.target.value)}
        />
        <label className="flex items-center gap-3 rounded border border-white/10 bg-black px-4 py-3 text-white">
          <input type="checkbox" checked={form.featuredOnHome} onChange={(e) => onFieldChange("featuredOnHome", e.target.checked)} />
          להציג בעמוד הבית
        </label>
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white md:col-span-2"
          placeholder="תמונת כרטיס (URL)"
          value={form.image}
          onChange={(e) => onFieldChange("image", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white md:col-span-2"
          placeholder="תמונה גדולה (URL)"
          value={form.modalImage}
          onChange={(e) => onFieldChange("modalImage", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="תמונה לפני (URL)"
          value={form.beforeImage}
          onChange={(e) => onFieldChange("beforeImage", e.target.value)}
          required
        />
        <input
          className="rounded border border-white/10 bg-black px-4 py-3 text-white"
          placeholder="תמונה אחרי (URL)"
          value={form.afterImage}
          onChange={(e) => onFieldChange("afterImage", e.target.value)}
          required
        />
        <textarea
          className="min-h-28 rounded border border-white/10 bg-black px-4 py-3 text-white md:col-span-2"
          placeholder="תיאור הפרויקט"
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
        />
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded bg-gold px-6 py-3 font-bold text-black disabled:opacity-70">
            {saving ? "שומר..." : editingId ? "שמור שינויים" : "הוסף פרויקט"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded border border-white/20 px-6 py-3 text-white"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              בטל עריכה
            </button>
          ) : null}
        </div>
        {statusMessage ? <p className="md:col-span-2 text-sm text-gold">{statusMessage}</p> : null}
      </form>

      <div className="mb-6 flex flex-wrap gap-4">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setCat(f.key)}
            className={[
              "rounded border px-4 py-2 text-sm font-medium",
              cat === f.key ? "border-gold bg-gold/10 text-gold" : "border-white/20 text-gray-300 hover:border-gold/50",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {loading ? <p className="text-gray-300">טוען פרויקטים...</p> : null}
        {list.map((p) => (
          <article key={p.id} className="rounded border border-white/10 bg-black/40 p-4">
            <div className="mb-3 h-40 w-full overflow-hidden rounded">
              <img className="h-full w-full object-cover" src={p.image} alt={p.title} />
            </div>
            <h3 className="font-serif text-lg text-white">{p.title}</h3>
            <p className="text-sm text-gray-400">{p.subtitle}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => startEdit(p)} className="rounded border border-gold/50 px-3 py-1 text-xs text-gold">
                עריכה
              </button>
              <button type="button" onClick={() => void onDelete(p.id)} className="rounded border border-red-400/50 px-3 py-1 text-xs text-red-300">
                מחיקה
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
