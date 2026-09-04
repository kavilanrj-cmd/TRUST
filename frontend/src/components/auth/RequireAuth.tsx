"use client";

import React from "react";

// TEMPORARY: Authentication bypass — always allow access.
// Real authentication will be restored later.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
