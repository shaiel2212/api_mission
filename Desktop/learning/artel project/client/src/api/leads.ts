export type LeadPayload = {
  name: string;
  phone: string;
  message?: string;
  source?: string;
  consent?: {
    marketing?: boolean;
    timestamp?: string;
    source?: string;
  };
};

export type LeadSuccess = { status: "success"; leadId: number; traceId?: string };

export type LeadError = {
  status: "error";
  code: string;
  message: string;
  traceId?: string;
  details?: unknown;
};

function collectAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    referrer: document.referrer || null,
    landingPath: `${window.location.pathname}${window.location.search}`,
    firstTouchAt: new Date().toISOString(),
  };
}

export async function submitLead(payload: LeadPayload): Promise<LeadSuccess> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      message: payload.message ?? "",
      source: payload.source ?? "website",
      attribution: collectAttribution(),
      consent: {
        marketing: Boolean(payload.consent?.marketing),
        timestamp: payload.consent?.timestamp ?? null,
        source: payload.consent?.source ?? "contact_form",
      },
    }),
  });

  const data = (await res.json()) as LeadSuccess | LeadError;

  if (!res.ok || data.status !== "success") {
    const err = data as LeadError;
    throw new Error(err.message || "שגיאה בשליחת הטופס");
  }

  return data;
}
