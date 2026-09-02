"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <AdminLayout>
      <p className="text-sm text-muted-foreground">
        Welcome. Redirecting to the admin dashboard…
      </p>
    </AdminLayout>
  );
}
