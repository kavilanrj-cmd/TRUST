import { API_BASE_URL } from "@/lib/api";

const ADMIN_BASE = "/api/admin";

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "FOUNDER" | "ADMIN" | "REVIEWER";
  isActive: boolean;
  permissions: string[];
}

export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new AdminApiError(401, "Not authenticated");
  }
  if (res.status === 403) {
    throw new AdminApiError(403, "You do not have permission to perform this action");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(res.status, (data as any).error || "Request failed");
  }
  return data as T;
}

const adminJSON = <T,>(url: string, method = "GET", body?: unknown): Promise<T> =>
  request<T>(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const adminApi = {
  base: ADMIN_BASE,

  login: (email: string, password: string) =>
    adminJSON<{ user: AdminUser }>(`${ADMIN_BASE}/login`, "POST", { email, password }),

  logout: () => adminJSON(`${ADMIN_BASE}/logout`, "POST"),

  me: () => adminJSON<{ user: AdminUser }>(`${ADMIN_BASE}/me`),

  dashboard: () => adminJSON<any>(`${ADMIN_BASE}/dashboard`),

  search: (query: string) =>
    adminJSON<any>(`${ADMIN_BASE}/search?q=${encodeURIComponent(query)}`),

  // --- Applications ---
  applications: {
    list: (params: Record<string, string | undefined>) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return adminJSON<any>(`${ADMIN_BASE}/applications${s ? `?${s}` : ""}`);
    },
    detail: (id: string) => adminJSON<any>(`${ADMIN_BASE}/applications/${id}`),
    changeStatus: (
      id: string,
      data: {
        status: string;
        note?: string;
        message?: string;
        missingDocuments?: string[];
        rejectionReasons?: string[];
      }
    ) => adminJSON<any>(`${ADMIN_BASE}/applications/${id}/status`, "PATCH", data),
    addNote: (id: string, data: { content: string }) =>
      adminJSON<any>(`${ADMIN_BASE}/applications/${id}/notes`, "POST", data),
    exportCsv: (params: Record<string, string | undefined>) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return `${ADMIN_BASE}/applications/export${s ? `?${s}` : ""}`;
    },
    documentAccess: (id: string) => `${ADMIN_BASE}/applications/documents/${id}/access`,
    verifyDocument: (id: string, data: { verificationStatus: string; reason?: string }) =>
      adminJSON<any>(`${ADMIN_BASE}/applications/documents/${id}/verify`, "PATCH", data),
  },

  // --- Students ---
  students: {
    list: (params: Record<string, string | undefined>) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return adminJSON<any>(`${ADMIN_BASE}/students${s ? `?${s}` : ""}`);
    },
    detail: (id: string) => adminJSON<any>(`${ADMIN_BASE}/students/${id}`),
  },

  // --- Scholarships ---
  scholarships: {
    list: () => adminJSON<any>(`${ADMIN_BASE}/scholarships`),
    detail: (id: string) => adminJSON<any>(`${ADMIN_BASE}/scholarships/${id}`),
    create: (data: any) => adminJSON<any>(`${ADMIN_BASE}/scholarships`, "POST", data),
    update: (id: string, data: any) => adminJSON<any>(`${ADMIN_BASE}/scholarships/${id}`, "PATCH", data),
    toggle: (id: string) => adminJSON<any>(`${ADMIN_BASE}/scholarships/${id}/toggle`, "PATCH"),
    remove: (id: string) => adminJSON<any>(`${ADMIN_BASE}/scholarships/${id}`, "DELETE"),
  },

  // --- Announcements ---
  announcements: {
    list: () => adminJSON<any>(`${ADMIN_BASE}/announcements`),
    create: (data: any) => adminJSON<any>(`${ADMIN_BASE}/announcements`, "POST", data),
    update: (id: string, data: any) => adminJSON<any>(`${ADMIN_BASE}/announcements/${id}`, "PATCH", data),
    toggle: (id: string) => adminJSON<any>(`${ADMIN_BASE}/announcements/${id}/toggle`, "PATCH"),
    remove: (id: string) => adminJSON<any>(`${ADMIN_BASE}/announcements/${id}`, "DELETE"),
  },

  // --- Media ---
  media: {
    list: (params?: Record<string, string | undefined>) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, v);
        });
      }
      const s = qs.toString();
      return adminJSON<any>(`${ADMIN_BASE}/media${s ? `?${s}` : ""}`);
    },
    upload: (formData: FormData) =>
      request<any>(`${ADMIN_BASE}/media`, { method: "POST", body: formData }),
    serve: (filename: string) => `${ADMIN_BASE}/media/serve/${filename}`,
    remove: (id: string) => adminJSON<any>(`${ADMIN_BASE}/media/${id}`, "DELETE"),
    update: (id: string, data: any) => adminJSON<any>(`${ADMIN_BASE}/media/${id}`, "PATCH", data),
  },

  // --- Users ---
  users: {
    list: () => adminJSON<any>(`${ADMIN_BASE}/users`),
    create: (data: any) => adminJSON<any>(`${ADMIN_BASE}/users`, "POST", data),
    update: (id: string, data: any) => adminJSON<any>(`${ADMIN_BASE}/users/${id}`, "PATCH", data),
    resetPassword: (id: string, newPassword: string) =>
      adminJSON<any>(`${ADMIN_BASE}/users/${id}`, "PATCH", { resetPassword: newPassword }),
  },

  // --- Settings ---
  settings: {
    list: () => adminJSON<any>(`${ADMIN_BASE}/settings`),
    update: (updates: Array<{ key: string; value: string }>) =>
      adminJSON<any>(`${ADMIN_BASE}/settings`, "PATCH", { updates }),
  },

  // --- Audit ---
  audit: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, v);
    });
    const s = qs.toString();
    return adminJSON<any>(`${ADMIN_BASE}/audit-logs${s ? `?${s}` : ""}`);
  },

  // --- Website CMS ---
  website: {
    content: () => adminJSON<any>(`${ADMIN_BASE}/website/content`),
    preview: () => adminJSON<any>(`${ADMIN_BASE}/website/preview`),
    saveDrafts: (updates: Array<{ key: string; value: string }>) =>
      adminJSON<any>(`${ADMIN_BASE}/website/content`, "PATCH", { updates }),
    publish: () => adminJSON<any>(`${ADMIN_BASE}/website/publish`, "POST"),
    versions: (key: string) => adminJSON<any>(`${ADMIN_BASE}/website/content/${encodeURIComponent(key)}/versions`),
    restore: (key: string, versionId: string) =>
      adminJSON<any>(`${ADMIN_BASE}/website/content/${encodeURIComponent(key)}/restore`, "POST", { versionId }),
  },

  notifications: {
    list: () => adminJSON<any>(`${ADMIN_BASE}/notifications`),
    unread: () => adminJSON<{ unreadCount: number }>(`${ADMIN_BASE}/notifications/count`),
    markRead: (id: string) => adminJSON(`${ADMIN_BASE}/notifications/${id}/read`, "PATCH"),
    markAllRead: () => adminJSON(`${ADMIN_BASE}/notifications/read-all`, "PATCH"),
  },

  // --- Contact messages ---
  contactMessages: {
    list: (params: Record<string, string | undefined> = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return adminJSON<any>(`${ADMIN_BASE}/contact-messages${s ? `?${s}` : ""}`);
    },
    detail: (id: string) => adminJSON<any>(`${ADMIN_BASE}/contact-messages/${id}`),
    markRead: (id: string, read = true) =>
      adminJSON<any>(`${ADMIN_BASE}/contact-messages/${id}/read`, "PATCH", { read }),
    remove: (id: string) => adminJSON<any>(`${ADMIN_BASE}/contact-messages/${id}`, "DELETE"),
  },

  // --- Payments ---
  payments: {
    list: (params: Record<string, string | undefined> = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return adminJSON<any>(`${ADMIN_BASE}/payments${s ? `?${s}` : ""}`);
    },
    exportCsv: (params: Record<string, string | undefined> = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") qs.set(k, v);
      });
      const s = qs.toString();
      return `${ADMIN_BASE}/payments/export${s ? `?${s}` : ""}`;
    },
    verify: (paymentId: string) => adminJSON<any>(`${ADMIN_BASE}/payments/${paymentId}/verify`, "POST"),
  },
};

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-50 text-blue-700",
    UNDER_REVIEW: "bg-amber-50 text-amber-700",
    DOCUMENT_VERIFICATION: "bg-purple-50 text-purple-700",
    CORRECTION_REQUESTED: "bg-orange-50 text-orange-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
    WAITLISTED: "bg-yellow-50 text-yellow-700",
    WITHDRAWN: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

export function roleColor(role: string): string {
  const map: Record<string, string> = {
    FOUNDER: "bg-gold-soft text-navy-800",
    ADMIN: "bg-navy-50 text-navy-800",
    REVIEWER: "bg-purple-50 text-purple-700",
  };
  return map[role] || "bg-gray-100 text-gray-700";
}

export function fmtDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
