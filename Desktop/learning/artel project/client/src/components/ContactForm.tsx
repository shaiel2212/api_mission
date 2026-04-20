import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { submitLead } from "../api/leads";
import { isPlausibleIsraeliPhone, normalizeIsraeliPhoneDigits } from "../lib/phoneIl";

type Props = {
  variant?: "dark" | "light";
};

export default function ContactForm({ variant = "dark" }: Props) {
  const formId = useId();
  const marketingId = `${formId}-marketing`;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLParagraphElement | null>(null);

  const isLight = variant === "light";
  const field =
    isLight
      ? "w-full border-b border-black/20 bg-transparent px-0 py-3 text-black placeholder:text-gray-500 focus:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      : "w-full border-b border-white/20 bg-transparent px-0 py-3 text-white placeholder:text-gray-500 focus:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const label = isLight ? "text-sm text-gray-600" : "text-sm text-gray-400";
  const linkClass = isLight ? "text-gold underline" : "text-gold/90 underline hover:text-gold";

  useEffect(() => {
    if (status === "success" && successRef.current) {
      successRef.current.focus();
    }
  }, [status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isPlausibleIsraeliPhone(phone)) {
      setStatus("error");
      setError("נא להזין מספר טלפון ישראלי תקין (לדוגמה 05X-XXXXXXX).");
      return;
    }
    setStatus("loading");
    const normalized = normalizeIsraeliPhoneDigits(phone);
    const consentTs = new Date().toISOString();
    try {
      await submitLead({
        name: name.trim(),
        phone: normalized,
        message: message.trim() || undefined,
        consent: {
          marketing: consentMarketing,
          timestamp: consentTs,
          source: "contact_form",
        },
      });
      setStatus("success");
      setName("");
      setPhone("");
      setMessage("");
      setConsentMarketing(false);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "שגיאה");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div
        className="min-h-[1.5rem] space-y-1"
        aria-live="polite"
        aria-atomic="true"
      >
        {error ? (
          <p className="text-sm text-red-400" id={`${formId}-error`} role="alert">
            {error}
          </p>
        ) : null}
        {status === "success" ? (
          <p
            ref={successRef}
            className="text-sm text-green-400 outline-none"
            id={`${formId}-ok`}
            role="status"
            tabIndex={-1}
          >
            התקבל — נחזור אליכם בהקדם. תודה!
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className={label}>
            שם מלא *
          </label>
          <input
            id="lead-name"
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${formId}-error` : undefined}
          />
        </div>
        <div>
          <label htmlFor="lead-phone" className={label}>
            טלפון * (ישראל)
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
            aria-required="true"
            aria-invalid={error ? true : undefined}
            pattern="[0-9+\\-\\s()]*"
            title="לדוגמה: 05X-XXXXXXX או +972-5X-XXXXXXX"
            aria-describedby={error ? `${formId}-error` : undefined}
          />
        </div>
      </div>
      <div>
        <label htmlFor="lead-message" className={label}>
          הודעה
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={field + " mt-1 resize-y"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${formId}-error` : undefined}
        />
      </div>

      <div className="space-y-2 text-sm">
        <label
          className={[
            "flex cursor-pointer items-start gap-3",
            isLight ? "text-gray-700" : "text-gray-300",
          ].join(" ")}
        >
          <input
            id={marketingId}
            type="checkbox"
            className="mt-1 h-4 w-4 min-h-[24px] min-w-[24px] rounded border-gold/50 bg-black text-gold focus-visible:ring-2 focus-visible:ring-gold"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.target.checked)}
          />
          <span>
            אני מסכים/ה לקבל מעת לעת הודעות שיווקיות (דוא&quot;ל/וואטסאפ). ניתן לבטל בכל עת.{" "}
            <Link to="/privacy" className={linkClass}>
              מדיניות פרטיות
            </Link>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-gold py-4 text-sm font-bold text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60"
      >
        {status === "loading" ? "שולחים…" : "שליחת פנייה"}
        <span aria-hidden="true">←</span>
      </button>
    </form>
  );
}
