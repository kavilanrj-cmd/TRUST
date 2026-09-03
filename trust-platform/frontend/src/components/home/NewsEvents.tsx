"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt?: string;
}

const FALLBACK: NewsItem[] = [
  {
    id: "n1",
    title: "Application Portal Now Open",
    category: "Announcement",
    content:
      "The application portal for the Neelakannu Educational Trust Scholarship is now open. Applications are being accepted until the deadline.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "n2",
    title: "Scholarship Eligibility Rules Updated",
    category: "Update",
    content:
      "The scholarship eligibility criteria have been updated for the latest intake. Please review the new requirements before applying.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "n3",
    title: "Contact Information",
    category: "News",
    content:
      "For any queries regarding the scholarship program, please contact the Trust using the details provided on the website.",
    createdAt: new Date().toISOString(),
  },
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function NewsEvents() {
  const { t } = useHomeContent();
  const [items, setItems] = useState<NewsItem[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/announcements`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("not available");
        const data = (await res.json()) as NewsItem[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      } catch {
        /* fall back to published editorial content */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="news" className="bg-cream dark:bg-[#0e1425]">
      <div className="container-trust section-pad">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">{t("home.news.eyebrow", "News & Updates")}</span>
            <h2 className="h2-section mt-4">{t("home.news.title", "Latest News & Events")}</h2>
            <p className="mt-4 text-muted-foreground">
              {t(
                "home.news.description",
                "Updates, announcements and opportunities from the Neelakannu Educational Trust."
              )}
            </p>
          </div>
          <a
            href="#news"
            className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-muted dark:border-white/15 dark:bg-[#131a2e] dark:text-white dark:hover:bg-black/20"
          >
            View All News
          </a>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90}>
              <article className="card-trust flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)]">
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-800 dark:text-gold">
                    {item.category ?? "Update"}
                  </span>
                  {item.createdAt && <time className="text-muted-foreground">{formatDate(item.createdAt)}</time>}
                </div>
                <h3 className="mt-4 font-semibold text-navy dark:text-white">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                <a
                  href="#news"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-600/80"
                >
                  Read More
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
