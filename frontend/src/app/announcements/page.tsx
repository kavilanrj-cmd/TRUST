import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Announcements",
  description: "Important announcements from Neelakannu Educational Trust",
};

export default function AnnouncementsPage() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="mb-12">
          <Link href="/" className="underline underline-offset-2 text-primary hover:text-primary-foreground">
            ← Back to Home
          </Link>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Important Announcements
          </h1>
        </header>

        <div className="space-y-6">
          {/* Announcement card 1 */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6.252a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Zm.354.807l-1.086 1.388.688 2.89.862.557a.75.75 0 0 0 .108-.698l-2.25-.555a.75.75 0 0 0-.702-.217l-.568-2.557a.75.75 0 0 0-.691-.108l-2.564.615-.608-2.318-1.086-1.388a2.25 2.25 0 0 0-2.03 0l-2.564.615-.6.338-1.086 1.388a.75.75 0 0 0-.066.908l2.25.555a.75.75 0 0 0 .702.217l.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608 2.318 1.086 1.388a.75.75 0 0 0 .066-.908l-2.25-.555a.75.75 0 0 0-.702-.217l-.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608-2.318-1.086 1.388Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Application Portal Now Open</h3>
                <p className="text-sm text-muted-foreground">
                  The application portal for the Neelakannu Educational Trust Scholarship
                  2026 is now open. Applications are being accepted until the deadline.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apply now and secure your future!
                </p>
              </div>
            </div>
          </div>

          {/* Announcement card 2 */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6.252a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Zm.354.807l-1.086 1.388.688 2.89.862.557a.75.75 0 0 0 .108-.698l-2.25-.555a.75.75 0 0 0-.702-.217l-.568-2.557a.75.75 0 0 0-.691-.108l-2.564.615-.608-2.318-1.086-1.388a2.25 2.25 0 0 0-2.03 0l-2.564.615-.6.338-1.086 1.388a.75.75 0 0 0-.066.908l2.25.555a.75.75 0 0 0 .702.217l.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608 2.318 1.086 1.388a.75.75 0 0 0 .066-.908l-2.25-.555a.75.75 0 0 0-.702-.217l-.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608-2.318-1.086 1.388Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Scholarship Eligibility Rules Updated</h3>
                <p className="text-sm text-muted-foreground">
                  The scholarship eligibility criteria have been updated for 2026 intake.
                  Please review the new eligibility requirements before applying.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your eligibility before applying.
                </p>
              </div>
            </div>
          </div>

          {/* Announcement card 3 */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6.252a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Zm.354.807l-1.086 1.388.688 2.89.862.557a.75.75 0 0 0 .108-.698l-2.25-.555a.75.75 0 0 0-.702-.217l-.568-2.557a.75.75 0 0 0-.691-.108l-2.564.615-.608-2.318-1.086-1.388a2.25 2.25 0 0 0-2.03 0l-2.564.615-.6.338-1.086 1.388a.75.75 0 0 0-.066.908l2.25.555a.75.75 0 0 0 .702.217l.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608 2.318 1.086 1.388a.75.75 0 0 0 .066-.908l-2.25-.555a.75.75 0 0 0-.702-.217l-.568 2.557a.75.75 0 0 0 .691.108l2.564-.615.608-2.318-1.086 1.388Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Contact Information Updated</h3>
                <p className="text-sm text-muted-foreground">
                  For any queries regarding the scholarship program, please contact
                  the Trust using the information provided on the website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
