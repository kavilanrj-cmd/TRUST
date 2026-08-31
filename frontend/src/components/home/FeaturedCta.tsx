export function FeaturedCta() {
  return (
    <section id="apply" aria-label="Apply for scholarship" className="bg-white">
      <div className="container-trust py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 px-8 py-14 text-center shadow-2xl sm:px-14">
          {/* decorative accents */}
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <span className="inline-flex items-center rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-navy">
            Applications Open
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to take the next step?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Check your eligibility and apply for the Neelakannu Educational
            Trust scholarship. Deserving students deserve the chance to shine.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#eligibility"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2"
            >
              Check Eligibility
            </a>
            <a
              href="#how-to-apply"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
