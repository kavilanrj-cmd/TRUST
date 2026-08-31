// Permission system for the Neelakannu Educational Trust admin panel.
// Permissions are enforced server-side. Frontend checks are cosmetic only.

export const ROLES = {
  FOUNDER: "FOUNDER",
  ADMIN: "ADMIN",
  REVIEWER: "REVIEWER",
  STUDENT: "STUDENT",
} as const;

export type RoleName = keyof typeof ROLES;

export const PERMISSIONS = {
  // applications
  applications_view: "applications.view",
  applications_review: "applications.review",
  applications_status: "applications.status",
  applications_notes: "applications.notes",
  applications_export: "applications.export",
  // documents
  documents_view: "documents.view",
  documents_verify: "documents.verify",
  documents_download: "documents.download",
  // scholarships
  scholarships_manage: "scholarships.manage",
  // announcements
  announcements_manage: "announcements.manage",
  // website / CMS
  website_edit: "website.edit",
  website_publish: "website.publish",
  website_preview: "website.preview",
  website_history: "website.history",
  // media
  media_manage: "media.manage",
  // settings
  settings_manage: "settings.manage",
  // users
  users_manage: "users.manage",
  // audit
  audit_view: "audit.view",
  // notifications
  notifications_view: "notifications.view",
  // dashboard
  dashboard_view: "dashboard.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default permission sets per role.
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [ROLES.FOUNDER]: Object.values(PERMISSIONS) as Permission[],
  [ROLES.STUDENT]: [],
  [ROLES.REVIEWER]: [
    PERMISSIONS.dashboard_view,
    PERMISSIONS.applications_view,
    PERMISSIONS.applications_review,
    PERMISSIONS.documents_view,
    PERMISSIONS.documents_download,
    PERMISSIONS.documents_verify,
    PERMISSIONS.notifications_view,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.dashboard_view,
    PERMISSIONS.applications_view,
    PERMISSIONS.applications_review,
    PERMISSIONS.applications_status,
    PERMISSIONS.applications_notes,
    PERMISSIONS.applications_export,
    PERMISSIONS.documents_view,
    PERMISSIONS.documents_download,
    PERMISSIONS.documents_verify,
    PERMISSIONS.scholarships_manage,
    PERMISSIONS.announcements_manage,
    PERMISSIONS.website_edit,
    PERMISSIONS.website_preview,
    PERMISSIONS.website_history,
    PERMISSIONS.media_manage,
    PERMISSIONS.audit_view,
    PERMISSIONS.notifications_view,
  ],
};

// Founder-only permissions (never granted to ADMIN/REVIEWER by default; ADMIN can
// be granted some of these explicitly via their permissions array, but the most
// sensitive ones are reserved for founder).
export const FOUNDER_ONLY_PERMISSIONS: Permission[] = [
  PERMISSIONS.website_publish,
  PERMISSIONS.settings_manage,
  PERMISSIONS.users_manage,
];

// Compute effective permissions for a user object (with optional custom overrides).
export function getPermissions(user: {
  role: string;
  permissions?: unknown;
}): Permission[] {
  if (user.role === ROLES.FOUNDER) {
    return Object.values(PERMISSIONS) as Permission[];
  }
  const base = ROLE_PERMISSIONS[user.role as RoleName] || [];

  // Merge custom permissions JSON if present (used for ADMIN grants).
  if (Array.isArray(user.permissions)) {
    const custom = user.permissions as Permission[];
    if (user.role === ROLES.ADMIN) {
      return Array.from(new Set<Permission>([...base, ...custom]));
    }
    // REVIEWER cannot gain founder-only/system-changing permissions via custom data.
    return base;
  }
  return base;
}

export function hasPermission(
  user: { role: string; permissions?: unknown },
  permission: Permission
): boolean {
  if (user.role === ROLES.FOUNDER) return true;
  const perms = getPermissions(user);
  return perms.includes(permission);
}

// Zod schema for validating custom permissions payloads.
export const permissionKeys: string[] = Object.values(PERMISSIONS);

export function sanitizePermissionList(list: unknown): Permission[] {
  if (!Array.isArray(list)) return [];
  const allowed = new Set<Permission>(Object.values(PERMISSIONS) as Permission[]);
  const filtered = list.filter(
    (p): p is Permission =>
      typeof p === "string" && allowed.has(p as Permission)
  );
  // Never allow REVIEWER to self-grant system permissions; this is enforced in the
  // permission resolver, not here — here we just sanitize to known values.
  return Array.from(new Set<Permission>(filtered));
}
