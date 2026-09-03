export const metadata = {
  title: "Neelakannu Educational Trust - Scholarship Program",
  description: "Scholarship program details for Neelakannu Educational Trust",
};

export default function ScholarshipPage() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Scholarship Program
          </h1>
          <p className="text-lg text-muted-foreground">
            Empowering deserving students through educational support
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Scholarship Name</h2>
            <p className="text-3xl font-bold text-primary mb-2">
              Neelakannu Educational Trust Scholarship 2026
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A merit-cum-means based scholarship program designed to support
              deserving students pursuing their academic goals.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Application Fee</h2>
            <p className="text-3xl font-bold text-primary mb-2">
              To be announced
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The application fee is configurable from the Trust&rsquo;s scholarship
              settings and must be paid via Razorpay to complete the application.
            </p>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Eligibility Criteria</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              Minimum educational qualification as specified by the Trust
            </li>
            <li>
              Minimum marks/CGPA as specified in scholarship settings
            </li>
            <li>
              Family income below the threshold specified by the Trust
            </li>
            <li>
              Applicant must be an Indian citizen
            </li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Required Documents</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              ID proof (Aadhar card, Pan card, etc.)
            </li>
            <li>
              Income certificate
            </li>
            <li>
              Recent marksheet/grade report
            </li>
            <li>
              Passport-sized photograph
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            The actual required documents are configurable from the Trust&rsquo;s
            scholarship settings.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Application Deadline</h2>
          <p className="text-2xl font-bold text-primary">
            To be announced
          </p>
          <p className="text-muted-foreground mt-2">
            Application deadline is configurable from the Trust&rsquo;s scholarship
            settings. Please apply before the specified date.
          </p>
        </section>

        <div>
          <h2 className="text-2xl font-semibold mb-4">How to Apply</h2>
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
            <li>
              Visit the Trust website and register for an account
            </li>
            <li>
              Complete the online application form with personal and academic details
            </li>
            <li>
              Upload the required documents (ID proof, income certificate, marksheet, photograph)
            </li>
            <li>
              Pay the application fee via Razorpay
            </li>
            <li>
              Submit the application and receive your Application ID
            </li>
            <li>
              Track your application status through the student dashboard
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
