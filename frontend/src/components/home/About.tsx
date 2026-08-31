export function About() {
  return (
    <section id="about" className="bg-white">
      <div className="container-trust grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-24">
        {/* Visual */}
        <div className="relative order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 p-10 shadow-2xl">
            <div
              className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-gold/20 blur-2xl"
              aria-hidden="true"
            />
            <svg viewBox="0 0 200 120" fill="none" className="mx-auto w-52 text-gold">
              <path d="M100 12 L176 50 L100 88 L24 50 Z" fill="currentColor" opacity="0.9" />
              <path d="M38 60 L38 84 C38 96 68 104 100 104 C132 104 162 96 162 84 L162 60" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M176 50 L176 86" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <p className="mt-6 text-center font-serif text-xl italic text-white">
              &ldquo;Education is the most powerful weapon which we can use to
              change the world.&rdquo;
            </p>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <span className="eyebrow">About Us</span>
          <h2 className="h2-section mt-4">Who We Are</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Neelakannu Educational Trust is a charitable organization
            established on 14th November 2018, dedicated to empowering students
            through education and scholarship opportunities. We believe every
            deserving student, regardless of economic background, deserves
            access to quality education and the chance to reach their full
            potential.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold text-navy">Our Vision</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A society where every deserving student, regardless of economic
                background, has access to quality education and the opportunity
                to reach their full potential.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold text-navy">Our Mission</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                To provide financial assistance, scholarship opportunities, and
                educational support to meritorious and deserving students
                through the Neelakannu Educational Trust.
              </p>
            </div>
          </div>

          <a href="#scholarships" className="btn-primary mt-8">
            Learn More About Our Work
          </a>
        </div>
      </div>
    </section>
  );
}
