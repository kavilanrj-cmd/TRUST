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
  def("home.hero.eyebrow", "home", "hero", "text", "Hero · Eyebrow", "Scholarships for Deserving Students", { maxLength: 80 }),
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

  // ---- Scholarships & Grants (home info section) ----
  def("home.scholarships.eyebrow", "home", "scholarships", "text", "Scholarships · Eyebrow", "Scholarships", { maxLength: 80 }),
  def("home.scholarships.title", "home", "scholarships", "text", "Scholarships · Title", "Scholarships and Grants", { maxLength: 120 }),
  def("home.scholarships.description", "home", "scholarships", "textarea", "Scholarships · Description", "The Trust promotes education mainly by way of scholarships and grants to deserving and needy students, helping them continue their studies with confidence.", { maxLength: 400 }),
  def("home.scholarships.applyCta", "home", "scholarships", "text", "Scholarships · Apply CTA", "Apply Now", { maxLength: 60 }),
  def("home.scholarships.eligibilityCta", "home", "scholarships", "text", "Scholarships · Eligibility CTA", "Check Eligibility", { maxLength: 60 }),
  def("home.scholarships.p1.title", "home", "scholarships", "text", "Scholarships · Support Pillar 1 Title", "Scholarships", { maxLength: 60 }),
  def("home.scholarships.p1.description", "home", "scholarships", "textarea", "Scholarships · Support Pillar 1 Description", "Financial support that helps needy students continue their education.", { maxLength: 300 }),
  def("home.scholarships.p2.title", "home", "scholarships", "text", "Scholarships · Support Pillar 2 Title", "Grants", { maxLength: 60 }),
  def("home.scholarships.p2.description", "home", "scholarships", "textarea", "Scholarships · Support Pillar 2 Description", "Direct grants offered to deserving and economically challenged students.", { maxLength: 300 }),
  def("home.scholarships.feeNote", "home", "scholarships", "textarea", "Scholarships · Fee Note", "A nominal, non-refundable application fee applies and is set by the Trust.", { maxLength: 300 }),
  def("home.scholarships.note", "home", "scholarships", "textarea", "Scholarships · Footnote", "New scholarship opportunities are announced regularly. Applications open for the current intake.", { maxLength: 300 }),

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
  def("home.footer.quickTitle", "home", "footer", "text", "Footer · Quick Links Title", "Quick Links", { maxLength: 60 }),
  def("home.footer.discoverTitle", "home", "footer", "text", "Footer · Discover Title", "Discover", { maxLength: 60 }),
  def("home.footer.contactTitle", "home", "footer", "text", "Footer · Contact Title", "Contact", { maxLength: 60 }),
  def("home.footer.address", "home", "footer", "textarea", "Footer · Address", "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India", { maxLength: 300 }),
  def("home.footer.email", "home", "footer", "text", "Footer · Email", "neelakannueducationaltrust@gmail.com", { maxLength: 120 }),
  def("home.footer.phone", "home", "footer", "text", "Footer · Phone", "94443 27336", { maxLength: 40 }),
  def("home.footer.copyright", "home", "footer", "text", "Footer · Copyright", "All rights reserved.", { maxLength: 80 }),

  // ---- Brand / Images ----
  def("home.brand.logo", "home", "brand", "image", "Brand · Logo", "/assets/neelakannu-trust-logo.png", { help: "Logo shown in the header, hero and footer. Recommended square image." }),

  // ---- What We Do (home section) ----
  def("home.whatWeDo.eyebrow", "home", "whatWeDo", "text", "What We Do · Eyebrow", "What We Do", { maxLength: 80 }),
  def("home.whatWeDo.title", "home", "whatWeDo", "text", "What We Do · Title", "Scholarships and Grants", { maxLength: 120 }),
  def("home.whatWeDo.description", "home", "whatWeDo", "textarea", "What We Do · Description", "Since its inception, the trust has promoted education mainly by way of scholarships and grants to deserving and needy students.", { maxLength: 400 }),
  def("home.whatWeDo.p1.title", "home", "whatWeDo", "text", "What We Do · Pillar 1 Title", "Scholarships", { maxLength: 60 }),
  def("home.whatWeDo.p1.description", "home", "whatWeDo", "textarea", "What We Do · Pillar 1 Description", "Financial support that helps needy students continue their education.", { maxLength: 300 }),
  def("home.whatWeDo.p2.title", "home", "whatWeDo", "text", "What We Do · Pillar 2 Title", "Grants", { maxLength: 60 }),
  def("home.whatWeDo.p2.description", "home", "whatWeDo", "textarea", "What We Do · Pillar 2 Description", "Direct grants offered to deserving and economically challenged students.", { maxLength: 300 }),
  def("home.whatWeDo.cta", "home", "whatWeDo", "text", "What We Do · CTA", "View Scholarships", { maxLength: 60 }),
  def("home.whatWeDo.quote", "home", "whatWeDo", "textarea", "What We Do · Quote", "Promoting education through scholarships and grants to deserving and needy students.", { maxLength: 300 }),
  def("home.whatWeDo.quoteTitle", "home", "whatWeDo", "text", "What We Do · Quote Title", "Scholarships & Grants", { maxLength: 60 }),

  // ---- About page ----
  def("about.eyebrow", "about", "about", "text", "About Page · Eyebrow", "About Us", { maxLength: 80 }),
  def("about.title", "about", "about", "text", "About Page · Title", "Neelakannu Educational Trust", { maxLength: 120 }),
  def("about.intro", "about", "about", "textarea", "About Page · Intro", "Established on 14th November 2018, Neelakannu Educational Trust is a charitable organization dedicated to empowering students through education and scholarship opportunities.", { maxLength: 500 }),
  def("about.registeredOfficeTitle", "about", "about", "text", "About Page · Registered Office Title", "Registered Office", { maxLength: 60 }),
  def("about.address", "about", "about", "textarea", "About Page · Address", "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India", { maxLength: 300 }),
  def("about.contactTitle", "about", "about", "text", "About Page · Contact Title", "Contact Information", { maxLength: 60 }),
  def("about.email", "about", "about", "text", "About Page · Email", "neelakannueducationaltrust@gmail.com", { maxLength: 120 }),
  def("about.phone", "about", "about", "text", "About Page · Phone", "94443 27336\n9790930494", { maxLength: 80 }),
  def("about.founderTitle", "about", "about", "text", "About Page · Founder Title", "Founder", { maxLength: 60 }),
  def("about.founder", "about", "about", "text", "About Page · Founder", "Prof. Dr. K. Chidambaram M.E., Ph.D.", { maxLength: 120 }),
  def("about.missionTitle", "about", "about", "text", "About Page · Mission Title", "Our Mission", { maxLength: 60 }),
  def("about.mission", "about", "about", "textarea", "About Page · Mission", "To provide deserving students with financial assistance and educational opportunities, regardless of their economic background, enabling them to pursue their academic dreams and contribute to society.", { maxLength: 600 }),

  // ---- About the Organization ----
  def("about.organizationTitle", "about", "about", "text", "About Page · About The Organization Title", "About the Organization", { maxLength: 120 }),
  def("about.organization", "about", "about", "textarea", "About Page · About The Organization", "Neelakannu Educational Trust is a registered public charitable trust dedicated to the advancement of education, social welfare, healthcare support, and cultural preservation across diverse sections of society. Established with a commitment to inclusive development, the Trust operates without discrimination on the basis of caste, creed, religion, or socio-economic status. The Trust seeks to empower individuals and communities through access to quality education, skill development, humanitarian assistance, and initiatives that promote national integration and social harmony. Particular emphasis is placed on supporting children, persons with disabilities, rural populations, and economically disadvantaged groups, enabling them to lead self-reliant and dignified lives.", { maxLength: 2000 }),

  // ---- Vision ----
  def("about.visionTitle", "about", "about", "text", "About Page · Vision Title", "Vision", { maxLength: 120 }),
  def("about.vision", "about", "about", "textarea", "About Page · Vision", "To build an inclusive and equitable society in which every individual, regardless of social, economic, or physical limitations, has access to education, opportunities for holistic development and the means to lead a dignified and productive life.", { maxLength: 2000 }),

  // ---- Mission ----
  def("about.missionTitle", "about", "about", "text", "About Page · Mission Title", "Mission", { maxLength: 120 }),
  def("about.mission", "about", "about", "textarea", "About Page · Mission", "To promote inclusive education, social upliftment, healthcare access, and cultural enrichment by establishing and supporting institutions, programs, and initiatives that empower marginalized communities and contribute to sustainable national development.", { maxLength: 2000 }),

  // ---- Founder ----
  def("about.founderTitle", "about", "about", "text", "About Page · Founder Title", "Founder", { maxLength: 60 }),
  def("about.founder", "about", "about", "textarea", "About Page · Founder", "Prof. Dr. K. Chidambaram\nME., Ph. D.\nFounder and Settlor\nNeelakannu Educational Trust was established under the visionary leadership of Prof. Dr. K. Chidambaram, an eminent educationist who served as a Principal of many leading engineering colleges for over three decades, besides serving as a Dean of an University. He is on the board as an advisor of many engineering colleges and Technical Institutions. With more than 40 years of experience in academic administration and student development, he has made significant contributions to higher education and institutional growth.\nDriven by a lifelong commitment to education, discipline, and social responsibility, Prof. Dr. Chidambaram founded the Trust to extend educational opportunities and welfare support to underserved sections of society. The Trust embodies his vision of empowering individuals through knowledge, values, and inclusive development.", { maxLength: 3000 }),

  // ---- Core Objectives and Areas of Work ----
  def("about.coreObjectivesTitle", "about", "about", "text", "About Page · Core Objectives Title", "Core Objectives and Areas of Work", { maxLength: 120 }),
  def("about.coreObjectives", "about", "about", "textarea", "About Page · Core Objectives Content", "Promotion of Education\n• Promote education for all children without discrimination\n• Establish, manage, and support schools, colleges, technical institutions, vocational institutions, and non-formal educational centers\n• Provide scholarships, grants, books, uniforms, and educational materials to deserving students\n• Support rural and tribal education initiatives\n• Conduct evening classes, literacy programs, and correspondence courses\n• Establish libraries, reading rooms, and knowledge centers\n• Publish educational books, periodicals, and literature\n• Conduct seminars, lectures, conferences, debates, and academic programs\n• Encourage academic excellence through awards, endowments, and scholarships\n\nSpecial Education and Support for Persons with Disabilities\n• Provide education for children who are mentally challenged, hearing impaired, visually impaired, or physically disabled\n• Provide assistive devices and rehabilitation support\n• Promote vocational skills and livelihood opportunities for persons with disabilities\n• Extend financial or material assistance to differently-abled individuals.", { maxLength: 3000 }),

  // ---- Cultural Promotion and National Integration ----
  def("about.culturalTitle", "about", "about", "text", "About Page · Cultural Promotion Title", "Cultural Promotion and National Integration", { maxLength: 120 }),
  def("about.cultural", "about", "about", "textarea", "About Page · Cultural Promotion Content", "• Promote Indian culture, heritage, philosophy, music, yoga, fine arts, and traditional crafts\n• Conduct cultural programs, seminars, and discussions\n• Preserve and promote national unity through cultural awareness initiatives", { maxLength: 2000 }),

  // ---- Student Welfare and Infrastructure Development ----
  def("about.welfareTitle", "about", "about", "text", "About Page · Welfare Title", "Student Welfare and Infrastructure Development", { maxLength: 120 }),
  def("about.welfare", "about", "about", "textarea", "About Page · Welfare Content", "• Establish and operate hostels and provide food and accommodation for students\n• Create safe and supportive learning environments for disadvantaged children\n• Support educational institutions through infrastructure development", { maxLength: 2000 }),

  // ---- Healthcare and Medical Support ----
  def("about.healthcareTitle", "about", "about", "text", "About Page · Healthcare Title", "Healthcare and Medical Support", { maxLength: 120 }),
  def("about.healthcare", "about", "about", "textarea", "About Page · Healthcare Content", "• Establish, support, and maintain hospitals, dispensaries, laboratories, rehabilitation centers, and healthcare facilities\n• Promote research and education in various systems of medicine including Allopathy, Ayurveda, Homeopathy, Naturopathy, and others\n• Conduct medical camps, eye camps, and health awareness programs\n• Provide medical assistance to economically disadvantaged individuals\n• Support training and development of healthcare personnel", { maxLength: 3000 }),

  // ---- Social Welfare and Community Development ----
  def("about.socialTitle", "about", "about", "text", "About Page · Social Title", "Social Welfare and Community Development", { maxLength: 120 }),
  def("about.social", "about", "about", "textarea", "About Page · Social Content", "• Provide assistance to poor, destitute, elderly, and incapacitated persons\n• Establish and maintain homes for the aged\n• Provide food, clothing, shelter, and relief during natural disasters and emergencies\n• Construct and maintain community centers and public utility infrastructure\n• Provide safe drinking water facilities\n• Support rural development initiatives\n• Assist traditional artisans and craftsmen", { maxLength: 3000 }),

  // ---- Public Benefit and Charitable Activities ----
  def("about.publicBenefitTitle", "about", "about", "text", "About Page · Public Benefit Title", "Public Benefit and Charitable Activities", { maxLength: 120 }),
  def("about.publicBenefit", "about", "about", "textarea", "About Page · Public Benefit Content", "• Provide employment support through development projects\n• Support educational and research institutions through grants and donations\n• Facilitate establishment and development of public welfare institutions\n• Accept donations, gifts, and contributions to further charitable objectives", { maxLength: 2000 }),

  // ---- Target Beneficiaries ----
  def("about.beneficiariesTitle", "about", "about", "text", "About Page · Target Beneficiaries Title", "Target Beneficiaries", { maxLength: 120 }),
  def("about.beneficiaries", "about", "about", "textarea", "About Page · Target Beneficiaries Content", "• Children and students from economically weaker sections\n• Persons with disabilities\n• Rural and tribal communities\n• Women and vulnerable groups\n• Elderly individuals\n• Illiterate adults\n• Poor and destitute populations", { maxLength: 2000 }),

  // ---- Future Plans ----
  def("about.futureTitle", "about", "about", "text", "About Page · Future Plans Title", "Future Plans", { maxLength: 120 }),
  def("about.future", "about", "about", "textarea", "About Page · Future Plans Content", "The Trust aims to expand its outreach and impact through:\n• Establishment of educational and vocational training centers\n• Expansion of student support and scholarship programs\n• Development of healthcare outreach initiatives\n• Creation of sustainable livelihood opportunities\n• Strengthening rural development activities\n• Promotion of inclusive education models", { maxLength: 3000 }),

  // ---- Contact page ----
  def("contact.eyebrow", "contact", "contact", "text", "Contact Page · Eyebrow", "Contact", { maxLength: 80 }),
  def("contact.title", "contact", "contact", "text", "Contact Page · Title", "Contact Us", { maxLength: 120 }),
  def("contact.intro", "contact", "contact", "textarea", "Contact Page · Intro", "We'd love to hear from you. Get in touch with Neelakannu Educational Trust.", { maxLength: 300 }),
  def("contact.officeTitle", "contact", "contact", "text", "Contact Page · Office Title", "Trust Office", { maxLength: 60 }),
  def("contact.address", "contact", "contact", "textarea", "Contact Page · Address", "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India", { maxLength: 300 }),
  def("contact.emailLabel", "contact", "contact", "text", "Contact Page · Email Label", "Email", { maxLength: 40 }),
  def("contact.email", "contact", "contact", "text", "Contact Page · Email", "neelakannueducationaltrust@gmail.com", { maxLength: 120 }),
  def("contact.phoneLabel", "contact", "contact", "text", "Contact Page · Phone Label", "Phone", { maxLength: 40 }),
  def("contact.phone", "contact", "contact", "text", "Contact Page · Phone", "94443 27336", { maxLength: 40 }),
  def("contact.messageTitle", "contact", "contact", "text", "Contact Page · Message Title", "Send Us a Message", { maxLength: 80 }),
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
