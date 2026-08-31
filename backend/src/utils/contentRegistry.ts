// Central CMS content registry for the Neelakannu Educational Trust website.
// Each editable item has a stable, namespaced key. The registry controls:
//   - which fields are editable
//   - default values (fallback for the public site)
//   - type (text / textarea / rich / image / url)
//   - max length & validation
// Developers control structure; admins control only these values.

export interface ContentFieldDef {
  key: string;
  page: string;
  section: string;
  type: "text" | "textarea" | "rich" | "image" | "url";
  label: string;
  defaultValue: string;
  maxLength?: number;
  editable: boolean;
  help?: string;
}

const def = (
  key: string,
  page: string,
  section: string,
  type: ContentFieldDef["type"],
  label: string,
  defaultValue: string,
  opts: Partial<ContentFieldDef> = {}
): ContentFieldDef => ({
  key,
  page,
  section,
  type,
  label,
  defaultValue,
  maxLength: opts.maxLength,
  editable: opts.editable ?? true,
  help: opts.help,
});

export const CONTENT_REGISTRY: ContentFieldDef[] = [
  // ---- Navbar ----
  def("nav.home", "home", "nav", "text", "Nav · Home", "Home", { maxLength: 40 }),
  def("nav.about", "home", "nav", "text", "Nav · About Us", "About Us", { maxLength: 40 }),
  def("nav.scholarships", "home", "nav", "text", "Nav · Scholarships", "Scholarships", { maxLength: 40 }),
  def("nav.howToApply", "home", "nav", "text", "Nav · How to Apply", "How to Apply", { maxLength: 40 }),
  def("nav.successStories", "home", "nav", "text", "Nav · Success Stories", "Success Stories", { maxLength: 40 }),
  def("nav.news", "home", "nav", "text", "Nav · News & Events", "News & Events", { maxLength: 40 }),
  def("nav.contact", "home", "nav", "text", "Nav · Contact", "Contact", { maxLength: 40 }),
  def("nav.applyLabel", "home", "nav", "text", "Nav · Apply Button", "Apply Now", { maxLength: 40 }),

  // ---- Hero ----
  · Eyebrow", "Scholarships for Deserving Students", { maxLength: 80 }),
  def("home.hero.title", "home", "hero", "text", "Hero · Title", "Neelakannu Educational Trust", { maxLength: 120 }),
  def("home.hero.description", "home", "hero", "textarea", "Hero · Description", "Supporting deserving students with educational opportunities, scholarships and financial assistance.", { maxLength: 400 }),
  def("home.hero.primaryButton", "home", "hero", "text", "Hero · Primary Button", "Apply for Scholarship", { maxLength: 60 }),
  def("home.hero.secondaryButton", "home", "hero", "text", "Hero · Secondary Button", "Learn More", { maxLength: 60 }),
  def("home.hero.stat1", "home", "hero", "text", "Hero · Stat 1 (value)", "2018", { maxLength: 20 }),
  def("home.hero.stat1Label", "home", "hero", "text", "Hero · Stat 1 (label)", "Established", { maxLength: 60 }),
  def("home.hero.stat2", "home", "hero", "text", "Hero · Stat 2 (value)", "100+", { maxLength: 20 }),
  def("home.hero.stat2Label", "home", "hero", "text", "Hero · Stat 2 (label)", "Students Supported", { maxLength: 60 }),
  def("home.hero.stat3", "home", "hero", "text", "Hero · Stat 3 (value)", "100%", { maxLength: 20 }),
  def("home.hero.stat3Label", "home", "hero", "text", "Hero · Stat 3 (label)", "Commitment to Education", { maxLength: 60 }),
  def("home.hero.quote", "home", "hero", "text", "Hero · Quote", "Empowering education, enabling dreams", { maxLength: 160 }),
  def("home.hero.quoteSub", "home", "hero", "text", "Hero · Quote Subtitle", "Scholarships for deserving students since 2018", { maxLength: 160 }),

  // ---- Impact / Trust statistics ----
  def("home.impact.scholarship", "home", "impact", "text", "Impact · Scholarship Amount", "₹50L+", { maxLength: 20 }),
  def("home.impact.scholarshipLabel", "home", "impact", "text", "Impact · Scholarship Label", "Scholarship Assistance", { maxLength: 60 }),
  def("home.impact.note", "home", "impact", "textarea", "Impact · Footnote", "Figures are configurable by the Trust and updated as verified reporting data is published.", { maxLength: 300 }),

  // ---- About ----
  def("home.about.eyebrow", "home", "about", "text", "About · Eyebrow", "Who We Are", { maxLength: 80 }),
  def("home.about.title", "home", "about", "text", "About · Title", "A Trust Built on Education and Compassion", { maxLength: 120 }),
  def("home.about.description", "home", "about", "rich", "About · Description", "Neelakannu Educational Trust was established to support meritorious yet economically challenged students in pursuing their educational dreams. We believe every child deserves the opportunity to learn, grow and succeed.", { maxLength: 1200 }),
  def("home.about.visionTitle", "home", "about", "text", "About · Vision Title", "Our Vision", { maxLength: 60 }),
  def("home.about.vision", "home", "about", "textarea", "About · Vision", "A society where every deserving student, regardless of economic background, has access to quality education and the opportunity to reach their full potential.", { maxLength: 500 }),
  def("home.about.missionTitle", "home", "about", "text", "About · Mission Title", "Our Mission", { maxLength: 60 }),
  def("home.about.mission", "home", "about", "textarea", "About · Mission", "To identify promising students, provide financial assistance and mentorship, and empower them to build brighter futures.", { maxLength: 500 }),
  def("home.about.quote", "home", "about", "text", "About · Quote", "Education is the most powerful weapon which you can use to change the world.", { maxLength: 300 }),

  // ---- Scholarships ----
  def("home.scholarships.eyebrow", "home", "scholarships", "text", "Scholarships · Eyebrow", "Scholarships", { maxLength: 80 }),
  def("home.scholarships.title", "home", "scholarships", "text", "Scholarships · Title", "Scholarship Program", { maxLength: 120 }),
  def("home.scholarships.description", "home", "scholarships", "textarea", "Scholarships · Description", "Our Scholarship Program supports deserving students with financial assistance and guidance so they can continue their education with confidence.", { maxLength: 400 }),
  def("home.scholarships.applyCta", "home", "scholarships", "text", "Scholarships · Apply CTA", "Apply Now", { maxLength: 60 }),
  def("home.scholarships.eligibilityCta", "home", "scholarships", "text", "Scholarships · Eligibility CTA", "Check Eligibility", { maxLength: 60 }),

  // ---- Featured CTA ----
  def("home.featuredCta.title", "home", "featuredCta", "text", "Featured CTA · Title", "Ready to take the next step?", { maxLength: 120 }),
  def("home.featuredCta.description", "home", "featuredCta", "textarea", "Featured CTA · Description", "Apply for a scholarship today and begin your journey towards a brighter educational future.", { maxLength: 300 }),
  def("home.featuredCta.primaryButton", "home", "featuredCta", "text", "Featured CTA · Primary", "Check Eligibility", { maxLength: 60 }),
  def("home.featuredCta.secondaryButton", "home", "featuredCta", "text", "Featured CTA · Secondary", "Apply Now", { maxLength: 60 }),

  // ---- Eligibility ----
  def("home.eligibility.eyebrow", "home", "eligibility", "text", "Eligibility · Eyebrow", "Eligibility Checker", { maxLength: 80 }),
  def("home.eligibility.title", "home", "eligibility", "text", "Eligibility · Title", "Check Your Eligibility", { maxLength: 120 }),
  def("home.eligibility.description", "home", "eligibility", "textarea", "Eligibility · Description", "Answer a few quick questions to see whether you meet the requirements for our scholarships.", { maxLength: 400 }),
  def("home.eligibility.helpText", "home", "eligibility", "textarea", "Eligibility · Help Text", "This quick check gives you an indicative result. Final eligibility is determined during the formal review.", { maxLength: 400 }),
  def("home.eligibility.submitLabel", "home", "eligibility", "text", "Eligibility · Submit", "Check Eligibility", { maxLength: 60 }),

  // ---- How to Apply ----
  def("home.howToApply.eyebrow", "home", "howToApply", "text", "How to Apply · Eyebrow", "How to Apply", { maxLength: 80 }),
  def("home.howToApply.title", "home", "howToApply", "text", "How to Apply · Title", "Application Process", { maxLength: 120 }),
  def("home.howToApply.description", "home", "howToApply", "textarea", "How to Apply · Description", "Follow these simple steps to submit your scholarship application.", { maxLength: 300 }),
  def("home.howToApply.step1.title", "home", "howToApply", "text", "Step 1 · Title", "Create an Account", { maxLength: 60 }),
  def("home.howToApply.step1.description", "home", "howToApply", "textarea", "Step 1 · Description", "Register on our portal with a valid email address.", { maxLength: 300 }),
  def("home.howToApply.step2.title", "home", "howToApply", "text", "Step 2 · Title", "Complete Your Application", { maxLength: 60 }),
  def("home.howToApply.step2.description", "home", "howToApply", "textarea", "Step 2 · Description", "Fill in your personal, academic and family details accurately.", { maxLength: 300 }),
  def("home.howToApply.step3.title", "home", "howToApply", "text", "Step 3 · Title", "Upload Documents", { maxLength: 60 }),
  def("home.howToApply.step3.description", "home", "howToApply", "textarea", "Step 3 · Description", "Upload the required supporting documents.", { maxLength: 300 }),
  def("home.howToApply.step4.title", "home", "howToApply", "text", "Step 4 · Title", "Submit Application", { maxLength: 60 }),
  def("home.howToApply.step4.description", "home", "howToApply", "textarea", "Step 4 · Description", "Review your information and submit your application.", { maxLength: 300 }),
  def("home.howToApply.step5.title", "home", "howToApply", "text", "Step 5 · Title", "Verification", { maxLength: 60 }),
  def("home.howToApply.step5.description", "home", "howToApply", "textarea", "Step 5 · Description", "Our team verifies your details and documents.", { maxLength: 300 }),
  def("home.howToApply.step6.title", "home", "howToApply", "text", "Step 6 · Title", "Scholarship Decision", { maxLength: 60 }),
  def("home.howToApply.step6.description", "home", "howToApply", "textarea", "Step 6 · Description", "Receive your scholarship decision and funding.", { maxLength: 300 }),

  // ---- Why Choose Us ----
  def("home.whyChooseUs.eyebrow", "home", "whyChooseUs", "text", "Why Choose Us · Eyebrow", "Why Choose Us", { maxLength: 80 }),
  def("home.whyChooseUs.title", "home", "whyChooseUs", "text", "Why Choose Us · Title", "Why Families Trust Us", { maxLength: 120 }),
  def("home.whyChooseUs.f1.title", "home", "whyChooseUs", "text", "Feature 1 · Title", "Transparent Process", { maxLength: 60 }),
  def("home.whyChooseUs.f1.description", "home", "whyChooseUs", "textarea", "Feature 1 · Description", "Clear, published criteria and a fair review process for every applicant.", { maxLength: 300 }),
  def("home.whyChooseUs.f2.title", "home", "whyChooseUs", "text", "Feature 2 · Title", "Student-Focused Support", { maxLength: 60 }),
  def("home.whyChooseUs.f2.description", "home", "whyChooseUs", "textarea", "Feature 2 · Description", "We are here to guide you at every step of your application journey.", { maxLength: 300 }),
  def("home.whyChooseUs.f3.title", "home", "whyChooseUs", "text", "Feature 3 · Title", "Secure Applications", { maxLength: 60 }),
  def("home.whyChooseUs.f3.description", "home", "whyChooseUs", "textarea", "Feature 3 · Description", "Your personal information and documents are handled securely and confidentially.", { maxLength: 300 }),
  def("home.whyChooseUs.f4.title", "home", "whyChooseUs", "text", "Feature 4 · Title", "Education for Every Deserving Student", { maxLength: 60 }),
  def("home.whyChooseUs.f4.description", "home", "whyChooseUs", "textarea", "Feature 4 · Description", "Our mission is to make quality education accessible to those who need it most.", { maxLength: 300 }),

  // ---- Success Stories ----
  def("home.successStories.eyebrow", "home", "successStories", "text", "Success Stories · Eyebrow", "Success Stories", { maxLength: 80 }),
  def("home.successStories.title", "home", "successStories", "text", "Success Stories · Title", "Stories of Achievement", { maxLength: 120 }),
  def("home.successStories.description", "home", "successStories", "textarea", "Success Stories · Description", "Read about the journeys of students whose lives were transformed through our scholarship programs.", { maxLength: 400 }),

  // ---- News & Events ----
  def("home.news.eyebrow", "home", "news", "text", "News · Eyebrow", "News & Updates", { maxLength: 80 }),
  def("home.news.title", "home", "news", "text", "News · Title", "Latest News & Events", { maxLength: 120 }),
  def("home.news.description", "home", "news", "textarea", "News · Description", "Stay up to date with our latest announcements, events and scholarship opportunities.", { maxLength: 400 }),

  // ---- Final CTA ----
  def("home.finalCta.title", "home", "finalCta", "text", "Final CTA · Title", "Your Education. Your Future. Our Support.", { maxLength: 120 }),
  def("home.finalCta.description", "home", "finalCta", "textarea", "Final CTA · Description", "Take the first step today and apply for a scholarship with Neelakannu Educational Trust.", { maxLength: 300 }),
  def("home.finalCta.primaryButton", "home", "finalCta", "text", "Final CTA · Primary", "Apply for Scholarship", { maxLength: 60 }),
  def("home.finalCta.secondaryButton", "home", "finalCta", "text", "Final CTA · Secondary", "Contact Us", { maxLength: 60 }),

  // ---- Footer ----
  def("home.footer.aboutTitle", "home", "footer", "text", "Footer · About Title", "About Neelakannu Educational Trust", { maxLength: 80 }),
  def("home.footer.description", "home", "footer", "textarea", "Footer · Description", "Neelakannu Educational Trust empowers deserving students through scholarships and financial assistance.", { maxLength: 400 }),
];

// Index helpers
export const CONTENT_MAP: Record<string, ContentFieldDef> = Object.fromEntries(
  CONTENT_REGISTRY.map((c) => [c.key, c])
);

export function defaultValueFor(key: string): string {
  return CONTENT_MAP[key]?.defaultValue || "";
}

export function isEditableKey(key: string): boolean {
  const def = CONTENT_MAP[key];
  return !!def && def.editable === true;
}

export function maxLengthFor(key: string): number | undefined {
  return CONTENT_MAP[key]?.maxLength;
}

export function validateContentValue(key: string, value: string): string | null {
  const field = CONTENT_MAP[key];
  if (!field) return `Unknown content key: ${key}`;
  if (typeof value !== "string") return "Value must be a string";
  if (field.maxLength && value.length > field.maxLength) {
    return `Exceeds maximum length (${field.maxLength})`;
  }
  return null;
}
