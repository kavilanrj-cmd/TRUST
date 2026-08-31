export function FinalCta() {
  return (
    <section id="final-cta" aria-label="Take the next step" className="bg-cream">
      <div className="container-trust py-16 sm:py-20">
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 px-8 py-16 text-center shadow-2xl sm:px-16"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold">
            Empowering education, enabling dreams
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Your Education. Your Future. Your Opportunity.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/80">
            Take the first step toward achieving your educational goals today.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-sm font-semibold text-navy transition hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2"
            >
              Apply Now
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
