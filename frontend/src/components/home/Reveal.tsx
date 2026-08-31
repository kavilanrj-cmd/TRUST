"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "figure" | "li";
}

/**
 * Lightweight scroll-reveal wrapper. Adds a `[data-reveal]` attribute and the
 * `reveal-visible` class once the element enters the viewport. Animations are
 * disabled entirely when the user prefers reduced motion (see globals.css).
 * Repeated reveals when scrolled back into view are handled by keeping the
 * visible class after first reveal.
 */
export function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as "div";
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <Tag ref={ref as any} data-reveal="true" className={className} style={style}>
      {children}
    </Tag>
  );
}
