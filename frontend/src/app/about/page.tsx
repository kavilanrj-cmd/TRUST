import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - About Us",
  description: "About Neelakannu Educational Trust, Chennai",
};

export default function AboutPage() {
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
            About Neelakannu Educational Trust
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Established on 14th November 2018, Neelakannu Educational Trust is a
            charitable organization dedicated to empowering students through education
            and scholarship opportunities.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Registered Office</h2>
            <p className="text-muted-foreground leading-relaxed">
              No. 1/82, Ayyanar Street,
              Shakthi Ayyanar Nagar,
              Thiruvanchery,
              Chennai - 600 126,
              Tamil Nadu, India
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a href="mailto:neelakannueducationaltrust@gmail.com" className="underline hover:text-primary">
                neelakannueducationaltrust@gmail.com
              </a>
              <br/>
              <span className="underline">94443 27336</span>
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Founder</h2>
          <p className="text-muted-foreground leading-relaxed">
            Prof. Dr. K. Chidambaram
          </p>
        </div>

        <div className="pt-12 border-t">
          <h3 className="text-xl font-medium mb-3">Our Mission</h3>
          <p className="text-muted-foreground leading-relaxed">
            To provide deserving students with financial assistance and educational
            opportunities, regardless of their economic background, enabling them to
            pursue their academic dreams and contribute to society.
          </p>
        </div>
      </div>
    </section>
  );
}
