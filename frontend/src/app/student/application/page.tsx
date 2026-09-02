"use client";

import Image from "next/image";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApplicationForm } from "@/components/student/ApplicationForm";

export default function StudentApplicationPage() {
  return (
    <RequireAuth>
      <section className="min-h-screen bg-surface-muted">
        <div className="container-trust py-10 sm:py-14">
          {/* Application page header */}
          <header className="mb-10 text-center">
            <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
              <Image
                src="/assets/neelakannu-trust-logo.png"
                alt="Neelakannu Educational Trust logo"
                width={56}
                height={56}
                className="h-14 w-14"
                priority
              />
              <span className="border-l border-border pl-3 pr-1 text-left">
                <span className="block text-sm font-semibold tracking-wide text-navy">Neelakannu Educational Trust</span>
                <span className="block text-xs text-muted-foreground">Empowering education</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Scholarship Application
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Please complete the application carefully and upload all required documents.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
              Fields marked with <span className="font-semibold text-destructive">*</span> are required.
            </p>
          </header>

          {/* Form container */}
          <main className="mx-auto w-full max-w-3xl">
            <ApplicationForm />
          </main>

          <footer className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-xs text-muted-foreground">
              Having trouble?
              <Link href="/contact" className="ml-1 font-medium text-navy underline underline-offset-2 hover:text-navy-700">
                Contact the Trust
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </RequireAuth>
  );
}
