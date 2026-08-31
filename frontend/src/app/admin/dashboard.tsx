import React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";

export const metadata = {
  title: "Neelakannu Educational Trust - Admin Dashboard",
  description: "Admin dashboard for Neelakannu Educational Trust",
};

export default function AdminDashboard() {
  const router = useRouter();

  interface Stats {
  totalApplications: number;
  draftApplications: number;
  submittedApplications: number;
  underReviewApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  waitlistedApplications: number;
  correctionRequestedApplications: number;
  successfulPayments: number;
  failedPayments: number;
}

const [stats, setStats] = React.useState<Stats>({
  totalApplications: 0,
  draftApplications: 0,
  submittedApplications: 0,
  underReviewApplications: 0,
  approvedApplications: 0,
  rejectedApplications: 0,
  waitlistedApplications: 0,
  correctionRequestedApplications: 0,
  successfulPayments: 0,
  failedPayments: 0,
});
  const [applications, setApplications] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [paymentFilter, setPaymentFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/dashboard", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setApplications(data.recentApplications || []);
      })
      .catch(() => {});
  }, [statusFilter, paymentFilter, searchQuery]);

  // Apply filters to applications
  const filteredApplications = applications.filter(
    (app: any) => {
      const matchesStatus = !statusFilter || app.status === statusFilter;
      const matchesPayment = !paymentFilter || (app.payment && app.payment[app.payment.length - 1].status === paymentFilter);
      const matchesSearch = !searchQuery || app.applicationId.includes(searchQuery) || (app.student && (app.student.email.includes(searchQuery) || app.student.name.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesStatus && matchesPayment && matchesSearch;
    }
  );

  // Determine status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "WAITLISTED": return "bg-orange-100 text-orange-800";
      case "CORRECTION_REQUESTED": return "bg-yellow-100 text-yellow-800";
      case "UNDER_REVIEW": return "bg-blue-100 text-blue-800";
      case "SUBMITTED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Admin</span>
              <button
                onClick={() => router.push("/admin/login")}
                className="text-sm text-red-600 hover underline"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Total Applications</p>
              <p className="text-2xl font-bold">{stats?.totalApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Draft</p>
              <p className="text-2xl font-bold">{stats?.draftApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Submitted</p>
              <p className="text-2xl font-bold">{stats?.submittedApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Under Review</p>
              <p className="text-2xl font-bold">{stats?.underReviewApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Approved</p>
              <p className="text-2xl font-bold">{stats?.approvedApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Rejected</p>
              <p className="text-2xl font-bold">{stats?.rejectedApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Waitlisted</p>
              <p className="text-2xl font-bold">{stats?.waitlistedApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Correction Requested</p>
              <p className="text-2xl font-bold">{stats?.correctionRequestedApplications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Successful Payments</p>
              <p className="text-2xl font-bold">{stats?.successfulPayments || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm mb-2">Failed Payments</p>
              <p className="text-2xl font-bold">{stats?.failedPayments || 0}</p>
            </div>
          </div>

          {/* Applications table */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow">
            <h2 className="text-xl font-medium px-6 py-3 border-b border-gray-200">Applications Management</h2>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Status Filter</label>
                <select
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT" selected={statusFilter === "DRAFT"}>DRAFT</option>
                  <option value="SUBMITTED" selected={statusFilter === "SUBMITTED"}>SUBMITTED</option>
                  <option value="UNDER_REVIEW" selected={statusFilter === "UNDER_REVIEW"}>UNDER_REVIEW</option>
                  <option value="APPROVED" selected={statusFilter === "APPROVED"}>APPROVED</option>
                  <option value="REJECTED" selected={statusFilter === "REJECTED"}>REJECTED</option>
                  <option value="WAITLISTED" selected={statusFilter === "WAITLISTED"}>WAITLISTED</option>
                  <option value="CORRECTION_REQUESTED" selected={statusFilter === "CORRECTION_REQUESTED"}>CORRECTION_REQUESTED</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Payment Filter</label>
                <select
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Payments</option>
                  <option value="SUCCESS" selected={paymentFilter === "SUCCESS"}>Success</option>
                  <option value="FAILED" selected={paymentFilter === "FAILED"}>Failed</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Search</label>
                <input
                  type="text"
                  placeholder="Search by application ID, student name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                    <th className="px-6 py-3">Application ID</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Scholarship</th>
                    <th className="px-6 py-3">Payment Status</th>
                    <th className="px-6 py-3">Application Status</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app: any) => (
                    <tr key={app.id} className="border-b border-gray-100">
                      <td className="px-6 py-3">{app.applicationId}</td>
                      <td className="px-6 py-3">{app.student?.name || "N/A"}</td>
                      <td className="px-6 py-3">{app.student?.email || "N/A"}</td>
                      <td className="px-6 py-3">{app.scholarshipProgram?.name || "N/A"}</td>
                      <td className="px-6 py-3">
                        {app.payment && app.payment.length > 0 ? app.payment[app.payment.length - 1].status : "N/A"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={getStatusClass(app.status)}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "N/A"}</td>
                      <td className="px-6 py-3">
                        <button
                          className="px-3 py-1 text-sm text-blue-600 hover underline"
                          onClick={() => window.alert(`View application ${app.applicationId}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}