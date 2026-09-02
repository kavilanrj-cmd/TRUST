"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Spinner, ErrorState, statusColor } from "@/components/admin/ui";
import { adminApi, fmtDate, fmtDateTime } from "@/lib/admin-api";

interface DashboardData {
  stats: Record<string, number>;
  charts: {
    applicationsOverTime: { date: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    scholarshipWise: { name: string; count: number }[];
    educationLevels: { level: string; count: number }[];
  };
  recentApplications: any[];
  recentActivity: any[];
  upcomingDeadlines: any[];
  recentWebsiteChanges: any[];
  notifications: { unreadCount: number; list: any[] };
  auditActivity: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .dashboard()
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <AdminLayout>
        <ErrorState message={error} />
      </AdminLayout>
    );
  }
  if (!data) {
    return (
      <AdminLayout>
        <Spinner />
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "Total Applications", value: data.stats.totalApplications, href: "/admin/applications" },
    { label: "Pending Review", value: data.stats.pendingApplications, href: "/admin/applications?status=SUBMITTED" },
    { label: "Under Review", value: data.stats.underReview, href: "/admin/applications?status=UNDER_REVIEW" },
    { label: "Doc Verification", value: data.stats.documentVerification, href: "/admin/applications?status=DOCUMENT_VERIFICATION" },
    { label: "Approved", value: data.stats.approved, href: "/admin/applications?status=APPROVED" },
    { label: "Total Students", value: data.stats.totalStudents, href: "/admin/students" },
  ];

  const maxOverTime = Math.max(1, ...data.charts.applicationsOverTime.map((p) => p.count));
  const points = data.charts.applicationsOverTime.map((p, i) => {
    const x = data.charts.applicationsOverTime.length <= 1 ? 0 : (i / (data.charts.applicationsOverTime.length - 1)) * 100;
    const y = 100 - (p.count / maxOverTime) * 100;
    return { x, y, ...p };
  });

  const maxStatus = Math.max(1, ...data.charts.statusDistribution.map((s) => s.count));
  const totalBySchool = data.charts.scholarshipWise.reduce((a, s) => a + s.count, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of applications, scholarships and activity.</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <div className="card-trust bg-white p-4 transition hover:shadow-md">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-3xl font-bold text-navy">{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Applications (Last 30 Days)" className="xl:col-span-2">
          <div className="relative h-56">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16294a" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16294a" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map((g) => (
                <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="#e4e8ef" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
              ))}
              <polygon
                points={`0,100 ${points.map((p) => `${p.x},${100 - (100 - p.y) * 0.9}`).join(" ")} 100,100`}
                fill="url(#areaFill)"
              />
              <polyline
                points={points.map((p) => `${p.x},${100 - (100 - p.y) * 0.9}`).join(" ")}
                fill="none"
                stroke="#c8a24a"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{fmtDate(points[0]?.date)}</span>
              <span>{fmtDate(points[points.length - 1]?.date)}</span>
            </div>
          </div>
        </Card>

        <Card title="Status Distribution">
          <div className="space-y-3">
            {data.charts.statusDistribution.map((s) => (
              <div key={s.status}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-navy">{s.status.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{s.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Recent Applications" className="xl:col-span-2" actions={<Link href="/admin/applications" className="text-xs font-semibold text-navy hover:underline">View all</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">ID</th>
                  <th className="pb-2 pr-4 font-semibold">Student</th>
                  <th className="pb-2 pr-4 font-semibold">Scholarship</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No applications yet</td></tr>
                )}
                {data.recentApplications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-navy">{a.applicationId}</td>
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/applications/${a.id}`} className="font-medium text-navy hover:underline">
                        {a.student?.name || "—"}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{a.scholarshipProgram?.name || "—"}</td>
                    <td className="py-2.5 pr-4"><Badge className={statusColor(a.status)}>{a.status.replace(/_/g, " ")}</Badge></td>
                    <td className="py-2.5 text-muted-foreground">{fmtDate(a.submittedAt || a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Upcoming Deadlines">
          {data.upcomingDeadlines.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
          )}
          <div className="space-y-3">
            {data.upcomingDeadlines.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-navy">{d.name}</p>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                </div>
                <Badge className="bg-amber-50 text-amber-700">{fmtDate(d.applicationDeadline)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Applications by Scholarship">
          {data.charts.scholarshipWise.length === 0 && (
            <p className="text-sm text-muted-foreground">No data.</p>
          )}
          <div className="space-y-3">
            {data.charts.scholarshipWise.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-navy">{s.name}</span>
                  <span className="ml-2 text-muted-foreground">{s.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${totalBySchool ? (s.count / totalBySchool) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="By Education Level">
          {data.charts.educationLevels.length === 0 && (
            <p className="text-sm text-muted-foreground">No data.</p>
          )}
          <div className="space-y-3">
            {data.charts.educationLevels.map((e) => (
              <div key={e.level} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm font-medium text-navy">{e.level || "—"}</span>
                <Badge className="bg-navy-50 text-navy-800">{e.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Activity">
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
          <div className="space-y-3">
            {data.recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <div>
                  <p className="text-sm text-navy">
                    <span className="font-medium">{act.actor?.name || "Staff"}</span>{" "}
                    <span className="text-muted-foreground">{act.type?.replace(/_/g, " ") || "updated"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(act.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data.notifications.unreadCount > 0 && (
        <div className="mt-6">
          <Card title="Unread Notifications" actions={<Link href="/admin/notifications" className="text-xs font-semibold text-navy hover:underline">View all</Link>}>
            <div className="space-y-3">
              {data.notifications.list.map((n: any) => (
                <div key={n.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-navy">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
