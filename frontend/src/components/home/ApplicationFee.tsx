"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface FeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
}

export function ApplicationFee() {
  const [fee, setFee] = useState<FeeConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setFee(d);
      })
      .catch(() => {
        /* ignore network errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fee || !fee.enabled || fee.amount <= 0) return null;

  return (
    <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold-soft px-4 py-2 text-sm font-semibold text-navy-800">
      Application Fee:
      <span className="font-serif text-base font-bold text-navy">
        ₹{Number(fee.amount).toLocaleString("en-IN")}
      </span>
    </div>
  );
}
