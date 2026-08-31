import Image from "next/image";
import { ScholarshipDetails } from "./ScholarshipDetails";

export const metadata = {
  title: "Neelakannu Educational Trust - Digital Scholarship Platform",
  description: "Scholarship and trust management platform for Neelakannu Educational Trust, Chennai",
};

export default function HomePage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-6xl text-center">
          {/* Hero Section */}
          <header className="mb-16">
            <Image
              src="/neelakannu-logo.svg"
              alt="Neelakannu Educational Trust Logo"
              width={150}
              height={150}
              className="mx-auto mb-8 dark:invert"
            />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Neelakannu Educational Trust
            </h1>
            <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Empowering deserving students through educational scholarships and
              trust management since 2018.
            </p>
          </header>

          {/* Vision & Mission */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Vision</h2>
            <blockquote className="blockquote">
              <p className="text-lg leading-relaxed mb-4">
                A society where every deserving student, regardless of economic
                background, has access to quality education and the opportunity to
                reach their full potential.
              </p>
              <p className="text-base text-primary font-medium">
                &ldquo;Empowering education, enabling dreams&rdquo;
              </p>
            </blockquote>
          </div>

          {/* Scholarship Information */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Scholarship Program</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <ScholarshipDetails />
              <div className="p-4 border rounded bg-card">
                <h4 className="font-medium mb-2">Eligibility</h4>
                <p className="text-muted-foreground">Minimum qualifications apply</p>
              </div>
            </div>
          </section>

          {/* Eligibility Checker */}
          <section className="mb-16">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-2xl font-semibold mb-4">Eligibility Checker</h2>
              <p className="text-muted-foreground mb-4">
                Check if you&rsquo;re eligible for the Neelakannu Educational Trust Scholarship
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Education Level
                  </label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select education level</option>
                    <option value="high_school">High School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Marks / CGPA
                  </label>
                  <input
                    type="number"
                    placeholder="Enter marks or CGPA"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Family Income (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter family income"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <button
                  className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Check Eligibility
                </button>
              </div>
            </div>
          </section>

          {/* How to Apply */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">How to Apply</h2>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground max-w-xl mx-auto">
              <li>
                Register on the Trust website
              </li>
              <li>
                Complete the application form
              </li>
              <li>
                Upload required documents
              </li>
              <li>
                Pay the application fee via Razorpay
              </li>
              <li>
                Submit application and receive Application ID
              </li>
              <li>
                Track application status
              </li>
            </ol>
          </section>

          {/* Announcements */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Announcements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card hover:bg-primary/5 transition-colors">
                <p className="text-sm text-muted-foreground">
                  Application portal now open for 2026 intake
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card hover:bg-primary/5 transition-colors">
                <p className="text-sm text-muted-foreground">
                  Scholarship eligibility rules updated
                </p>
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <footer className="mt-16 pt-12 border-t">
            <div className="flex flex-col md:flex-row justify-center md:justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold mb-3">Neelakannu Educational Trust</h3>
                <p className="text-muted-foreground">
                  Established: 14th November 2018
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <svg
                    className="w-4 h-4 text-primary flex-shrink-0 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2 3h20v2H2V3zm0 6h20v2H2V9zm0 6h20v2H2V15zm0 6h20v2H2V21z" />
                  </svg>
                  neelakannueducationaltrust@gmail.com
                </p>
                <p className="text-sm text-muted-foreground">
                  <svg
                    className="w-4 h-4 text-primary flex-shrink-0 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2 3h20v2H2V3zm0 6h20v2H2V9zm0 6h20v2H2V15zm0 6h20v2H2V21z" />
                  </svg>
                  94443 27336
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}