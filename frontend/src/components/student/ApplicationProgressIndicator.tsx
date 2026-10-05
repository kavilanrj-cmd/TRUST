"use client";

// Application-process indicator for the student dashboard.
//
// Shows the real nine-step application process (the same order the wizard uses)
// with each step marked complete, current or upcoming from stored application data
// only. Progress is never estimated and never animated to look further along than
// the record actually is.
//
// Layout: a vertical rail below `lg` so a phone gets a readable single column
// instead of a squashed nine-across row, and a horizontal rail from `lg` up. Labels
// are allowed to wrap rather than overflow, so the page never gains a horizontal
// scrollbar at any width.

import type { ApplicationProgress } from "@/lib/application-progress";

function StepBadge({
  state,
  index,
  label,
}: {
  state: "complete" | "current" | "upcoming";
  index: number;
  label: string;
}) {
  const tone =
    state === "complete"
      ? "bg-success text-success-foreground"
      : state === "current"
        ? "bg-gold text-navy shadow-sm"
        : "border border-border bg-surface-muted text-muted-foreground";

  const stateWord =
    state === "complete" ? "completed" : state === "current" ? "in progress" : "not completed";

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone}`}
      role="img"
      aria-label={`Step ${index + 1}, ${label}: ${stateWord}`}
    >
      {state === "complete" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        index + 1
      )}
    </span>
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`${done ? "bg-success/50" : "bg-border"} my-1 block w-0.5 shrink-0 rounded-full lg:my-0 lg:ml-0.5 lg:h-0.5 lg:w-full lg:shrink`}
    />
  );
}

export function ApplicationProgressIndicator({
  progress,
  heading = "Application Process",
  description,
}: {
  progress: ApplicationProgress;
  heading?: string;
  description?: string;
}) {
  const completedCount = progress.steps.filter((step) => step.state === "complete").length;

  return (
    <section className="rounded-lg border border-border bg-card p-6" aria-label={heading}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-medium">{heading}</h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            progress.started
              ? "bg-gold-soft text-navy dark:bg-white/10 dark:text-gold"
              : "border border-border bg-surface-muted text-muted-foreground"
          }`}
        >
          {progress.summary}
        </span>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        {description ??
          (progress.started
            ? `${completedCount} of ${progress.steps.length} steps completed.`
            : "Your application has not been started yet. Begin with Personal details.")}
      </p>

      <ol className="flex flex-col lg:flex-row lg:items-start">
        {progress.steps.map((step, index) => {
          const isLast = index === progress.steps.length - 1;
          return (
            <li
              key={step.label}
              className="flex gap-3 lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-0"
            >
              <div className="flex flex-col items-center lg:w-full lg:flex-row lg:items-center">
                <StepBadge state={step.state} index={step.index} label={step.label} />
                {!isLast && <Connector done={step.state === "complete"} />}
              </div>
              <div className={`min-w-0 flex-1 lg:mt-3 lg:w-full lg:flex-none ${isLast ? "" : "pb-5"}`}>
                <p
                  className={`text-xs leading-tight break-words hyphens-auto ${
                    step.state === "complete"
                      ? "text-success"
                      : step.state === "current"
                        ? "font-semibold text-navy dark:text-white"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[11px] leading-snug break-words text-muted-foreground">
                  {step.hint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}