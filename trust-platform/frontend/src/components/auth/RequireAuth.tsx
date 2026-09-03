"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-surface-muted">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </section>
    );
  }

  return <>{children}</>;
}
