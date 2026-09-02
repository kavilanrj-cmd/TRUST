"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";

// Default fallback values mirroring the backend CMS content registry
// (backend/src/utils/contentRegistry.ts). These render instantly before the
// published content fetch resolves, and also cover keys that were never
// published. Components may also pass their own tighter fallback to t().
export const CMS_DEFAULTS: Record<string, string> = {
  // Nav
  "nav.home": "Home",
  "nav.about": "About Us",
  "nav.whatWeDo": "What We Do",
  "nav.scholarships": "Scholarships",
  "nav.howToApply": "How to Apply",
  "nav.successStories": "Success Stories",
  "nav.news": "News & Events",
  "nav.contact": "Contact",
  "nav.applyLabel": "Apply Now",
  // Hero
  "home.hero.badge": "Scholarships for Deserving Students",
  "home.hero.title": "Neelakannu Educational Trust",
  "home.hero.description":
    "Empowering deserving students through educational scholarships and trust management since 2018.",
  "home.hero.primaryButton": "Apply for Scholarship",
  "home.hero.secondaryButton": "Learn More",
  "home.hero.stat1": "2018",
  "home.hero.stat1Label": "Established",
  "home.hero.stat2": "100+",
  "home.hero.stat2Label": "Students Supported",
  "home.hero.stat3": "100%",
  "home.hero.stat3Label": "Commitment to Education",
  "home.hero.quote": "Empowering education, enabling dreams",
  "home.hero.quoteSub": "Scholarships for deserving students since 2018",
  // Impact / Trust statistics
  "home.impact.scholarship": "₹50L+",
  "home.impact.scholarshipLabel": "Scholarship Assistance",
  "home.impact.note":
    "Figures are configurable by the Trust and updated as verified reporting data is published.",
  // About
  "home.about.eyebrow": "Who We Are",
  "home.about.title": "A Trust Built on Education and Compassion",
  "home.about.description":
    "Neelakannu Educational Trust was established to support meritorious yet economically challenged students in pursuing their educational dreams. We believe every child deserves the opportunity to learn, grow and succeed.",
  "home.about.visionTitle": "Our Vision",
  "home.about.vision":
    "A society where every deserving student, regardless of economic background, has access to quality education and the opportunity to reach their full potential.",
  "home.about.missionTitle": "Our Mission",
  "home.about.mission":
    "To identify promising students, provide financial assistance and mentorship, and empower them to build brighter futures.",
  "home.about.quote":
    "Education is the most powerful weapon which you can use to change the world.",
  // Scholarships & Grants (home info section)
  "home.scholarships.eyebrow": "Scholarships",
  "home.scholarships.title": "Scholarships and Grants",
  "home.scholarships.description":
    "The Trust promotes education mainly by way of scholarships and grants to deserving and needy students, helping them continue their studies with confidence.",
  "home.scholarships.applyCta": "Apply Now",
  "home.scholarships.eligibilityCta": "Check Eligibility",
  "home.scholarships.p1.title": "Scholarships",
  "home.scholarships.p1.description": "Financial support that helps needy students continue their education.",
  "home.scholarships.p2.title": "Grants",
  "home.scholarships.p2.description": "Direct grants offered to deserving and economically challenged students.",
  "home.scholarships.feeNote": "A nominal, non-refundable application fee applies and is set by the Trust.",
  "home.scholarships.note": "New scholarship opportunities are announced regularly. Applications open for the current intake.",
  // Featured CTA
  "home.featuredCta.title": "Ready to take the next step?",
  "home.featuredCta.description":
    "Apply for a scholarship today and begin your journey towards a brighter educational future.",
  "home.featuredCta.primaryButton": "Check Eligibility",
  "home.featuredCta.secondaryButton": "Apply Now",
  // Eligibility
  "home.eligibility.eyebrow": "Eligibility Checker",
  "home.eligibility.title": "Check Your Eligibility",
  "home.eligibility.description":
    "Answer a few quick questions to see whether you meet the requirements for our scholarships.",
  "home.eligibility.helpText":
    "This quick check gives you an indicative result. Final eligibility is determined during the formal review.",
  "home.eligibility.submitLabel": "Check Eligibility",
  // How to Apply
  "home.howToApply.eyebrow": "How to Apply",
  "home.howToApply.title": "Application Process",
  "home.howToApply.description":
    "Follow these simple steps to submit your scholarship application.",
  "home.howToApply.step1.title": "Create an Account",
  "home.howToApply.step1.description": "Register on our portal with a valid email address.",
  "home.howToApply.step2.title": "Complete Your Application",
  "home.howToApply.step2.description": "Fill in your personal, academic and family details accurately.",
  "home.howToApply.step3.title": "Upload Documents",
  "home.howToApply.step3.description": "Upload the required supporting documents.",
  "home.howToApply.step4.title": "Submit Application",
  "home.howToApply.step4.description": "Review your information and submit your application.",
  "home.howToApply.step5.title": "Verification",
  "home.howToApply.step5.description": "Our team verifies your details and documents.",
  "home.howToApply.step6.title": "Scholarship Decision",
  "home.howToApply.step6.description": "Receive your scholarship decision and funding.",
  // Why Choose Us
  "home.whyChooseUs.eyebrow": "Why Choose Us",
  "home.whyChooseUs.title": "Why Families Trust Us",
  "home.whyChooseUs.f1.title": "Transparent Process",
  "home.whyChooseUs.f1.description": "Clear, published criteria and a fair review process for every applicant.",
  "home.whyChooseUs.f2.title": "Student-Focused Support",
  "home.whyChooseUs.f2.description": "We are here to guide you at every step of your application journey.",
  "home.whyChooseUs.f3.title": "Secure Applications",
  "home.whyChooseUs.f3.description": "Your personal information and documents are handled securely and confidentially.",
  "home.whyChooseUs.f4.title": "Education for Every Deserving Student",
  "home.whyChooseUs.f4.description":
    "Our mission is to make quality education accessible to those who need it most.",
  // Success Stories
  "home.successStories.eyebrow": "Success Stories",
  "home.successStories.title": "Stories of Achievement",
  "home.successStories.description":
    "Read about the journeys of students whose lives were transformed through our scholarship programs.",
  // News & Events
  "home.news.eyebrow": "News & Updates",
  "home.news.title": "Latest News & Events",
  "home.news.description":
    "Stay up to date with our latest announcements, events and scholarship opportunities.",
  // Final CTA
  "home.finalCta.title": "Your Education. Your Future. Our Support.",
  "home.finalCta.description":
    "Take the first step today and apply for a scholarship with Neelakannu Educational Trust.",
  "home.finalCta.primaryButton": "Apply for Scholarship",
  "home.finalCta.secondaryButton": "Contact Us",
  // Footer
  "home.footer.aboutTitle": "About Neelakannu Educational Trust",
  "home.footer.description":
    "Neelakannu Educational Trust empowers deserving students through scholarships and financial assistance.",
  "home.footer.quickTitle": "Quick Links",
  "home.footer.discoverTitle": "Discover",
  "home.footer.contactTitle": "Contact",
  "home.footer.address":
    "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India",
  "home.footer.email": "neelakannueducationaltrust@gmail.com",
  "home.footer.phone": "94443 27336",
  "home.footer.copyright": "All rights reserved.",
  // Brand / Images
  "home.brand.logo": "/assets/neelakannu-trust-logo.png",
  // What We Do (home section)
  "home.whatWeDo.eyebrow": "What We Do",
  "home.whatWeDo.title": "Scholarships and Grants",
  "home.whatWeDo.description":
    "Since its inception, the trust has promoted education mainly by way of scholarships and grants to deserving and needy students.",
  "home.whatWeDo.p1.title": "Scholarships",
  "home.whatWeDo.p1.description": "Financial support that helps needy students continue their education.",
  "home.whatWeDo.p2.title": "Grants",
  "home.whatWeDo.p2.description": "Direct grants offered to deserving and economically challenged students.",
  "home.whatWeDo.cta": "View Scholarships",
  "home.whatWeDo.quote":
    "Promoting education through scholarships and grants to deserving and needy students.",
  "home.whatWeDo.quoteTitle": "Scholarships & Grants",
  // About page
  "about.eyebrow": "About Us",
  "about.title": "About Neelakannu Educational Trust",
  "about.intro":
    "Established on 14th November 2018, Neelakannu Educational Trust is a charitable organization dedicated to empowering students through education and scholarship opportunities.",
  "about.registeredOfficeTitle": "Registered Office",
  "about.address":
    "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India",
  "about.contactTitle": "Contact Information",
  "about.email": "neelakannueducationaltrust@gmail.com",
  "about.phone": "94443 27336",
  "about.founderTitle": "Founder",
  "about.founder": "Prof. Dr. K. Chidambaram",
  "about.missionTitle": "Our Mission",
  "about.mission":
    "To provide deserving students with financial assistance and educational opportunities, regardless of their economic background, enabling them to pursue their academic dreams and contribute to society.",
  // Contact page
  "contact.eyebrow": "Contact",
  "contact.title": "Contact Us",
  "contact.intro": "We'd love to hear from you. Get in touch with Neelakannu Educational Trust.",
  "contact.officeTitle": "Trust Office",
  "contact.address":
    "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India",
  "contact.emailLabel": "Email",
  "contact.email": "neelakannueducationaltrust@gmail.com",
  "contact.phoneLabel": "Phone",
  "contact.phone": "94443 27336",
  "contact.messageTitle": "Send Us a Message",
};

let cache: Record<string, string> = { ...CMS_DEFAULTS };
let inflight: Promise<Record<string, string>> | null = null;

async function loadPublished(): Promise<Record<string, string>> {
  if (inflight) return inflight;
  inflight = fetch(`${API_BASE_URL}/api/content/published`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && d.content && typeof d.content === "object") {
        cache = { ...CMS_DEFAULTS, ...d.content };
      }
      return cache;
    })
    .catch(() => cache)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Used by non-React code paths if ever needed; components prefer useHomeContent().
export function getHomeContentNow(): Record<string, string> {
  return cache;
}

export function useHomeContent() {
  const [content, setContent] = useState<Record<string, string>>(cache);

  useEffect(() => {
    let alive = true;
    loadPublished().then((c) => {
      if (alive) setContent(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  // t(key, fallback?) — returns published value, else bundled default, else
  // the caller-provided fallback (defaults to the empty string).
  const t = (key: string, fallback = "") => {
    const v = content[key];
    if (v !== undefined && v !== null && v !== "") return v;
    const d = CMS_DEFAULTS[key];
    if (d !== undefined && d !== "") return d;
    return fallback;
  };

  return { content, t };
}
