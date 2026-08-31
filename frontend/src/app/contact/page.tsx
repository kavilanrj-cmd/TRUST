import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Contact",
  description: "Contact information for Neelakannu Educational Trust",
};

export default function ContactPage() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="mb-12">
          <Link href="/" className="underline underline-offset-2 text-primary hover:text-primary-foreground">
            &larr; Back to Home
          </Link>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground">
            We&apos;d love to hear from you. Get in touch with Neelakannu Educational Trust.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Trust Office</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                No. 1/82, Ayyanar Street,
                Shakthi Ayyanar Nagar,
                Thiruvanchery,
                Chennai - 600 126,
                Tamil Nadu, India
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Email: <a href="mailto:neelakannueducationaltrust@gmail.com" className="underline hover:text-primary">
                  neelakannueducationaltrust@gmail.com
                </a>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Phone: 94443 27336
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={4}
                  placeholder="Your message here..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t">
          <h3 className="text-xl font-medium mb-4">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <li><Link href="/" className="underline hover:text-primary">Home</Link></li>
            <li><Link href="/about" className="underline hover:text-primary">About</Link></li>
            <li><Link href="/vision-mission" className="underline hover:text-primary">Vision & Mission</Link></li>
            <li><Link href="/scholarship" className="underline hover:text-primary">Scholarship</Link></li>
            <li><Link href="/announcements" className="underline hover:text-primary">Announcements</Link></li>
            <li><Link href="/contact" className="underline hover:text-primary">Contact</Link></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
