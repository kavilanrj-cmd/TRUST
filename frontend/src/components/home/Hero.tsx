export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1100px 500px at 85% -10%, rgba(200,162,74,0.12), transparent 60%), radial-gradient(800px 480px at -5% 0%, rgba(22,41,74,0.06), transparent 55%)",
        }}
      />

      <div className="container-trust relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left copy */}
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            Neelakannu Educational Trust
          </span>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            Empowering Dreams Through Education
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Supporting deserving students with educational opportunities,
            scholarships and financial assistance.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#apply" className="btn-gold">
              Apply for Scholarship
            </a>
            <a href="#eligibility" className="btn-outline">
              Check Eligibility
            </a>
          </div>

          <div className="mt-10 flex items-center gap-8 border-t border-border pt-6">
            <div>
              <p className="font-serif text-2xl font-bold text-navy">2018</p>
              <p className="text-sm text-muted-foreground">Established</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-navy">100+</p>
              <p className="text-sm text-muted-foreground">Students Supported</p>
            </div>
            <div className="hidden sm:block">
              <p className="font-serif text-2xl font-bold text-gold-600">100%</p>
              <p className="text-sm text-muted-foreground">Commitment to Education</p>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up delay-150 lg:max-w-none">
          <div className="relative rounded-3xl bg-gradient-to-br from-navy-700 to-navy p-8 shadow-2xl sm:p-10">
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-gold/20 blur-2xl"
              aria-hidden="true"
            />
            <div className="animate-float absolute -left-5 -top-5 rounded-2xl border border-border bg-white p-3 shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-7 w-7 text-navy">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13c-2.364-.807-4.755-1.248-7-1.253-1.6 0-3.1.3-4.5.9v12.2c1.4-.6 2.9-.9 4.5-.9 2.245.005 4.636.446 7 1.253m0-13c2.364-.807 4.755-1.248 7-1.253 1.6 0 3.1.3 4.5.9v12.2c-1.4-.6-2.9-.9-4.5-.9-2.245-.005-4.636-.446-7-1.253" />
              </svg>
            </div>
            <div
              className="animate-float absolute -bottom-5 -right-5 rounded-2xl border border-border bg-white p-3 shadow-lg"
              style={{ animationDelay: "1.5s" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-7 w-7 text-gold-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Abstract graduation/education imagery */}
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <svg viewBox="0 0 200 120" fill="none" className="mb-8 w-56 text-gold">
                <path d="M100 12 L176 50 L100 88 L24 50 Z" fill="currentColor" opacity="0.9" />
                <path d="M38 60 L38 84 C38 96 68 104 100 104 C132 104 162 96 162 84 L162 60" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M176 50 L176 86" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
              </svg>
              <p className="font-serif text-2xl font-bold italic text-white">
                &ldquo;Empowering education, enabling dreams&rdquo;
              </p>
              <p className="mt-3 text-sm text-white/75">
                Scholarships for deserving students since 2018
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
