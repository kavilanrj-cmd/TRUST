"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { Spinner } from "@/components/admin/ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  founderOnly?: boolean;
  founderOrAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/admin/applications", label: "Applications", icon: "document" },
  { href: "/admin/students", label: "Students", icon: "users" },
  { href: "/admin/scholarships", label: "Scholarships", icon: "award" },
  { href: "/admin/certificates", label: "Certificates", icon: "certificate" },
  { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },
  { href: "/admin/contact-messages", label: "Contact Messages", icon: "mail" },
  { href: "/admin/payments", label: "Payments", icon: "card" },
  { href: "/admin/website", label: "Website Editor", icon: "layout" },
  { href: "/admin/media", label: "Media", icon: "image" },
  { href: "/admin/notifications", label: "Notifications", icon: "bell" },
  { href: "/admin/users", label: "Staff", icon: "users", founderOnly: true },
  { href: "/admin/audit", label: "Audit Logs", icon: "list" },
  { href: "/admin/settings", label: "Settings", icon: "settings", founderOrAdmin: true },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </>
  ),
  certificate: (
    <>
      <path d="M9 12h6M9 16h6M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M8 14.5 10 17l6-7" />
    </>
  ),
  megaphone: (
    <>
      <path d="m3 11 18-5v12L3 14z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {ICONS[name] || ICONS.grid}
    </svg>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    adminApi
      .me()
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Actively redirect unauthenticated users to /admin/login (server-side APIs
  // also enforce auth, but we never want an admin page to render unauthenticated).
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    adminApi.notifications
      .unread()
      .then((d) => setUnread(d.unreadCount))
      .catch(() => {});
    const t = setInterval(() => {
      adminApi.notifications.unread().then((d) => setUnread(d.unreadCount)).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, [user]);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      /* ignore */
    }
    router.push("/admin/login");
  };

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0b1020]">
        <span className="text-sm text-muted-foreground">Redirecting to login...</span>
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter((n) =>
    n.founderOnly
      ? user.role === "FOUNDER"
      : n.founderOrAdmin
        ? user.role === "FOUNDER" || user.role === "ADMIN"
        : true
  );

  const initials = (user.name || user.email || "U")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b1020]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-sm font-bold text-navy">
            N
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Neelakannu Trust</p>
            <p className="text-[11px] uppercase tracking-wider text-white/60">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-gold/90">
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
                {item.href === "/admin/notifications" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 text-[11px] text-white/50">
          Role: <span className="font-semibold text-white/80">{user.role}</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-white px-4 sm:px-6 dark:bg-[#131a2e] dark:border-slate-700">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-navy dark:border-white/20 dark:text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <NavIcon name="list" />
          </button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <input
              type="search"
              placeholder="Search applications, scholarships, people..."
              className="field-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                  router.push(`/admin/search?q=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`);
                }
              }}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-navy hover:bg-muted dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              onClick={() => router.push("/admin/notifications")}
              aria-label="Notifications"
            >
              <NavIcon name="bell" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-lg border border-border py-1.5 pl-1.5 pr-3 hover:bg-muted dark:border-white/20 dark:hover:bg-white/10"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white dark:bg-gold dark:text-navy">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium text-navy sm:block dark:text-white">{user.name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-white p-1.5 shadow-lg dark:border-white/15 dark:bg-[#131a2e]">
                    <div className="border-b border-border px-3 py-2 dark:border-white/10">
                      <p className="text-sm font-semibold text-navy dark:text-white">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/"
                      className="block rounded-md px-3 py-2 text-sm text-navy hover:bg-muted dark:text-white dark:hover:bg-white/10"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      View public site
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block rounded-md px-3 py-2 text-sm text-navy hover:bg-muted dark:text-white dark:hover:bg-white/10"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
