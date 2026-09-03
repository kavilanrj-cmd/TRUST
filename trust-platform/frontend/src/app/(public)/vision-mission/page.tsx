export const metadata = {
  title: "Neelakannu Educational Trust - Vision & Mission",
  description: "Vision and mission of Neelakannu Educational Trust",
};

export default function VisionMissionPage() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Our Vision & Mission
          </h1>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Vision</h2>
            <blockquote className="blockquote">
              <p className="text-lg leading-relaxed mb-6">
                A society where every deserving student, regardless of economic
                background, has access to quality education and the opportunity to
                reach their full potential.
              </p>
              <p className="text-base text-primary font-medium">
                &ldquo;Empowering education, enabling dreams&rdquo;
              </p>
            </blockquote>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Mission</h2>
            <blockquote className="blockquote">
              <p className="text-lg leading-relaxed mb-6">
                To provide financial assistance, scholarship opportunities, and
                educational support to meritorious and deserving students through
                the Neelakannu Educational Trust.
              </p>
              <p className="text-base text-primary font-medium">
                &ldquo;Education is the most powerful weapon which we can use to change the world.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6 dark:text-white">Core Values</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-primary/5 text-primary-foreground dark:text-white">
              <h4 className="font-medium mb-2">Integrity</h4>
              <p className="text-sm text-muted-foreground">
                Transparent and ethical operations in all trust activities.
              </p>
            </div>
            <div className="p-4 border rounded bg-primary/5 text-primary-foreground dark:text-white">
              <h4 className="font-medium mb-2">Equity</h4>
              <p className="text-sm text-muted-foreground">
                Fair and impartial distribution of scholarship opportunities.
              </p>
            </div>
            <div className="p-4 border rounded bg-primary/5 text-primary-foreground dark:text-white">
              <h4 className="font-medium mb-2">Excellence</h4>
              <p className="text-sm text-muted-foreground">
                Encouraging and supporting academic excellence in all students.
              </p>
            </div>
            <div className="p-4 border rounded bg-primary/5 text-primary-foreground dark:text-white">
              <h4 className="font-medium mb-2">Service</h4>
              <p className="text-sm text-muted-foreground">
                Dedicated service to the student community and society.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
