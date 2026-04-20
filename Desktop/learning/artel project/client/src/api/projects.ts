import { buildCsrfHeaders } from "../lib/csrf";

export type ProjectCategory = "renovation" | "office" | "construction";

export type ProjectRecord = {
  id: number;
  title: string;
  category: ProjectCategory;
  subtitle: string;
  year: string;
  location: string;
  image: string;
  modalImage: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  featuredOnHome: boolean;
  areaLabel?: string | null;
  architect?: string | null;
};

export type ProjectPayload = Omit<ProjectRecord, "id">;

type ListResponse = { status: "success"; projects: ProjectRecord[] };
type SingleResponse = { status: "success"; project: ProjectRecord };
type DeleteResponse = { status: "success" };
type ApiError = { status: "error"; code: string; message: string };

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T | ApiError;
  if (!res.ok || (data as ApiError).status === "error") {
    const err = data as ApiError;
    throw new Error(err.message || "שגיאה בבקשת פרויקטים");
  }
  return data as T;
}

let projectsListCache:
  | {
      promise: Promise<ProjectRecord[]>;
      expiresAt: number;
    }
  | undefined;

export async function listProjects(): Promise<ProjectRecord[]> {
  const now = Date.now();
  if (projectsListCache && projectsListCache.expiresAt > now) {
    return projectsListCache.promise;
  }

  const promise = (async () => {
    const res = await fetch("/api/projects");
    const data = await parseResponse<ListResponse>(res);
    return data.projects;
  })();

  // Short TTL prevents duplicate fetches during React StrictMode dev remounts,
  // while still keeping data reasonably fresh when navigating between pages.
  projectsListCache = { promise, expiresAt: now + 1500 };

  try {
    return await promise;
  } catch (e) {
    projectsListCache = undefined;
    throw e;
  }
}

export async function createProject(payload: ProjectPayload): Promise<ProjectRecord> {
  projectsListCache = undefined;
  const res = await fetch("/api/projects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...buildCsrfHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<SingleResponse>(res);
  return data.project;
}

export async function updateProject(id: number, payload: ProjectPayload): Promise<ProjectRecord> {
  projectsListCache = undefined;
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...buildCsrfHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<SingleResponse>(res);
  return data.project;
}

export async function deleteProject(id: number): Promise<void> {
  projectsListCache = undefined;
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include", headers: { ...buildCsrfHeaders() } });
  await parseResponse<DeleteResponse>(res);
}
