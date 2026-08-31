"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Badge, Field, Spinner, ErrorState, EmptyState, pageHeading, roleColor, fmtDateTime, inputCls } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "FOUNDER" | "ADMIN" | "REVIEWER";
  isActive: boolean;
  permissions: string[];
  isFounderProtected?: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminApi.users
      .list()
      .then((d) => setUsers(d.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (u: StaffUser) => {
    if (u.isFounderProtected) {
      setMsg("The founder account cannot be deactivated.");
      return;
    }
    try {
      await adminApi.users.update(u.id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  return (
    <AdminLayout>
      {pageHeading("Staff Management", "Manage admin and reviewer accounts.")}

      {msg && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">{msg}</div>
      )}

      <Card
        actions={
          <Button variant="gold" onClick={() => { setShowCreate(true); setEditing(null); }}>
            Add Staff
          </Button>
        }
      >
        {error && <ErrorState message={error} />}
        {!error && loading && <Spinner />}
        {!error && !loading && users.length === 0 && <EmptyState title="No staff users" />}
        {!error && !loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Name</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Role</th>
                  <th className="pb-2 pr-4 font-semibold">Active</th>
                  <th className="pb-2 pr-4 font-semibold">Permissions</th>
                  <th className="pb-2 pr-4 font-semibold">Last Login</th>
                  <th className="pb-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-navy">{u.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 pr-4"><Badge className={roleColor(u.role)}>{u.role}</Badge></td>
                    <td className="py-2.5 pr-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.isFounderProtected}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${u.isActive ? "bg-green-500" : "bg-gray-300"} ${u.isFounderProtected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${u.isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                      {u.role === "FOUNDER" ? "All" : u.permissions?.length > 0 ? u.permissions.length : "Default"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fmtDateTime(u.lastLoginAt)}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(u); setShowCreate(false); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setResetId(u.id)}>Reset PW</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && <CreateUserForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {editing && <EditUserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {resetId && (
        <ResetPasswordDialog
          userId={resetId}
          onClose={() => setResetId(null)}
        />
      )}
    </AdminLayout>
  );
}

function CreateUserForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "REVIEWER">("REVIEWER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminApi.users.create({ name, email, password, role });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-base font-semibold text-navy">Add Staff Member</h3>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field>
          <Field label="Role">
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "REVIEWER")}>
              <option value="ADMIN">Admin</option>
              <option value="REVIEWER">Reviewer</option>
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
        </div>
      </form>
    </div>
  );
}

function EditUserForm({ user, onClose, onSaved }: { user: StaffUser; onClose: () => void; onSaved: () => void }) {
  const [isActive, setIsActive] = useState(user.isActive);
  const [permissions, setPermissions] = useState(user.permissions?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const perms = permissions.split(",").map((s) => s.trim()).filter(Boolean);
      await adminApi.users.update(user.id, { isActive, permissions: perms });
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-base font-semibold text-navy">Edit {user.name}</h3>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-navy">Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${isActive ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </label>
          {user.role === "ADMIN" && (
            <Field label="Custom Permissions (comma-separated)" hint="e.g. applications.view, media.manage">
              <input className={inputCls} value={permissions} onChange={(e) => setPermissions(e.target.value)} />
            </Field>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}

function ResetPasswordDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await adminApi.users.resetPassword(userId, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-base font-semibold text-navy">Reset Password</h3>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {done ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Password updated successfully.</p>
            <p className="mt-1 text-xs text-muted-foreground">Ask the user to sign in with the new password.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Enter a new password for this user.</p>
            <input
              type="password"
              autoComplete="new-password"
              className="field-input"
              placeholder="New password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!done && (
            <Button variant="danger" disabled={loading} onClick={handleReset}>
              {loading ? "Saving…" : "Reset Password"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
