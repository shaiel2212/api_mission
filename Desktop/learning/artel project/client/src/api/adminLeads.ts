import { adminJsonHeaders, adminReadHeaders, withCredentials } from "./adminAuth";
import { readJsonBody } from "./readJsonBody";
import { apiUrl } from "../config/apiBase";

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";
export type LeadPriority = "low" | "normal" | "high";

export type AdminLead = {
  id: number;
  name: string;
  phone: string;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: number | null;
  lostReason: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  consentMarketing?: boolean;
  consentTimestamp?: string | null;
  consentSource?: string | null;
};

type ApiError = {
  status: "error";
  code?: string;
  message?: string;
};

type ListLeadsResponse = {
  status: "success";
  leads: AdminLead[];
};

type UpdateLeadResponse = {
  status: "success";
  lead: AdminLead;
};

export type UpdateLeadPayload = {
  status?: LeadStatus;
  priority?: LeadPriority;
  note?: string;
  lostReason?: string;
  nextFollowUpAt?: string | null;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await readJsonBody(res)) as T | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message || "שגיאה בבקשת אדמין.");
  }
  return data as T;
}

export async function fetchAdminLeads(limit = 50) {
  const res = await fetch(apiUrl(`/api/admin/leads?limit=${limit}`), withCredentials({ headers: adminReadHeaders() }));
  const data = await parseResponse<ListLeadsResponse>(res);
  return data.leads;
}

export async function updateAdminLead(leadId: number, payload: UpdateLeadPayload) {
  const res = await fetch(apiUrl(`/api/admin/leads/${leadId}`), withCredentials({
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  }));
  const data = await parseResponse<UpdateLeadResponse>(res);
  return data.lead;
}
