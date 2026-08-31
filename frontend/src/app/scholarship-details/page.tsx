"use client";

import { useEffect, useState } from "react";

interface Scholarship {
  applicationFee: number | null;
  applicationDeadline: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ScholarshipDetailsPage() {
  return <ScholarshipDetailsContent />;
}

function ScholarshipDetailsContent() {
  const [fee, setFee] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/scholarships`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to load scholarship details");
        }
        const data = (await res.json()) as Scholarship[];
        const scholarship = Array.isArray(data) ? data[0] : undefined;

        if (!cancelled) {
          setFee(
            scholarship?.applicationFee != null
              ? `\u20B9${scholarship.applicationFee.toLocaleString("en-IN")}`
              : null
          );
          setDeadline(
            scholarship?.applicationDeadline
              ? formatDeadline(scholarship.applicationDeadline)
              : null
          );
        }
      } catch {
        if (!cancelled) {
          setFee(null);
          setDeadline(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="p-4 border rounded bg-card">
        <h4 className="font-medium mb-2">Application Fee</h4>
        <p className="text-3xl font-bold text-primary">
          {loading ? "Loading\u2026" : fee ?? "To be announced"}
        </p>
      </div>
      <div className="p-4 border rounded bg-card">
        <h4 className="font-medium mb-2">Deadline</h4>
        <p className="text-muted-foreground">{deadline ?? "To be announced"}</p>
      </div>
    </>
  );
}

function formatDeadline(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
