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
            <div className="mx-auto mb-6 flex w-fit items-center justify-center gap-3">
              <Image
                src="/assets/neelakannu-trust-logo.png"
                alt="Neelakannu Educational Trust logo"
                width={64}
                height={64}
                className="h-16 w-16 sm:h-20 sm:w-20"
                priority
              />
              <span className="text-left">
                <span className="block text-base font-bold tracking-wide text-navy dark:text-white">Neelakannu Educational Trust</span>
                <span className="block text-sm text-muted-foreground dark:text-slate-400">Empowering education</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-navy dark:text-white sm:text-4xl">
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
              <Link href="/contact" className="ml-1 font-medium text-navy dark:text-gold underline underline-offset-2 hover:text-navy-700 dark:hover:text-gold/80">
                Contact the Trust
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </RequireAuth>
  );
}
