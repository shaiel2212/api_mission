import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminLead,
  LeadPriority,
  LeadStatus,
  fetchAdminLeads,
  updateAdminLead,
} from "../../api/adminLeads";

const statuses: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "חדש" },
  { value: "contacted", label: "נוצר קשר" },
  { value: "qualified", label: "מתאים" },
  { value: "proposal_sent", label: "הצעה נשלחה" },
  { value: "won", label: "נסגר" },
  { value: "lost", label: "אבוד" },
];

const priorities: Array<{ value: LeadPriority; label: string }> = [
  { value: "low", label: "נמוכה" },
  { value: "normal", label: "רגילה" },
  { value: "high", label: "גבוהה" },
];

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("he-IL");
}

/** זמן שעבר ממועד יצירת הליד — עוזר ל-SLA פנימי. */
function formatOpenSla(createdAt: string) {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) {
    return "—";
  }
  const diff = Date.now() - t;
  if (diff < 0) {
    return "0 דק׳";
  }
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 60) {
    return `${m} דק׳ מפתיחה`;
  }
  if (h < 48) {
    return `${h} ש׳ מפתיחה`;
  }
  if (d < 14) {
    return `${d} ימים מפתיחה`;
  }
  return `מעל שבועיים`;
}

export default function AdminLeadsPanel() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | "">("");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [priority, setPriority] = useState<LeadPriority>("normal");
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  useEffect(() => {
    void loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const list = await fetchAdminLeads(100);
      setLeads(list);
      if (list.length > 0) {
        setSelectedLeadId((current) => (current === "" ? list[0].id : current));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת לידים");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedLeadId === "") {
      setError("בחר ליד לעדכון");
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const updated = await updateAdminLead(selectedLeadId, {
        status,
        priority,
        note: note.trim() || undefined,
        lostReason: lostReason.trim() || undefined,
      });
      setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
      setMessage(`הליד #${updated.id} עודכן בהצלחה`);
      setNote("");
      setLostReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בעדכון ליד");
    }
  }

  return (
    <div className="text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">ניהול לידים</h2>
          <p className="mt-1 text-sm text-gray-400">סטטוסים, עדיפות והערות פנימיות.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadLeads()}
          disabled={loading}
          className="rounded bg-gold px-5 py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "טוען..." : "רענן לידים"}
        </button>
      </div>

      {error ? <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">{error}</p> : null}
      {message ? (
        <p className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{message}</p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        <div className="overflow-hidden rounded border border-white/15 bg-black/50">
          <div className="border-b border-white/15 px-4 py-3 text-sm text-gray-300">לידים אחרונים</div>
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="bg-white/5 text-right text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">שם</th>
                  <th className="px-4 py-3 font-medium">טלפון</th>
                  <th className="px-4 py-3 font-medium">סטטוס</th>
                  <th className="px-4 py-3 font-medium">עדיפות</th>
                  <th className="px-4 py-3 font-medium">נוצר</th>
                  <th className="px-4 py-3 font-medium">שיווק</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`cursor-pointer border-t border-white/10 ${
                      selectedLeadId === lead.id ? "bg-gold/10" : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setStatus(lead.status);
                      setPriority(lead.priority);
                      setLostReason(lead.lostReason ?? "");
                    }}
                  >
                    <td className="px-4 py-3">{lead.id}</td>
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3">{lead.status}</td>
                    <td className="px-4 py-3">{lead.priority}</td>
                    <td className="px-4 py-3">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">{lead.consentMarketing === true ? "כן" : "—"}</td>
                  </tr>
                ))}
                {!loading && leads.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-400" colSpan={7}>
                      אין נתונים. לחץ &quot;רענן לידים&quot;.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <form className="rounded border border-white/15 bg-black/50 p-5" onSubmit={handleUpdate}>
          <h3 className="mb-4 text-xl font-bold">עדכון ליד</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-300">ליד נבחר</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              >
                <option value="">בחר ליד</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    #{lead.id} - {lead.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-300">סטטוס</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              >
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-300">עדיפות</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              >
                {priorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-300">סיבת אובדן (רק אם Lost)</label>
              <input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-300">הערה פנימית</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              />
            </div>

            <button className="w-full rounded bg-gold px-5 py-2.5 font-bold text-black" type="submit">
              שמור עדכון
            </button>
          </div>

          {selectedLead ? (
            <div className="mt-6 border-t border-white/15 pt-4 text-sm text-gray-300">
              <p>
                <span className="text-white">SLA (זמן ממועד יצירה):</span> {formatOpenSla(selectedLead.createdAt)}
              </p>
              <p>
                <span className="text-white">שם:</span> {selectedLead.name}
              </p>
              <p>
                <span className="text-white">טלפון:</span> {selectedLead.phone}
              </p>
              <p>
                <span className="text-white">מקור:</span> {selectedLead.source ?? "—"}
              </p>
              <p>
                <span className="text-white">הסכמה לשיווק:</span> {selectedLead.consentMarketing === true ? "כן" : "לא"}
                {selectedLead.consentTimestamp ? (
                  <span className="ms-1 text-gray-500">({formatDate(selectedLead.consentTimestamp)})</span>
                ) : null}
              </p>
              <p>
                <span className="text-white">הודעה:</span> {selectedLead.message || "—"}
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
