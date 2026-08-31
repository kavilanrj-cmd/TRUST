import { SiteHeader } from "@/components/home/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { TrustImpact } from "@/components/home/TrustImpact";
import { About } from "@/components/home/About";
import { Scholarships } from "@/components/home/Scholarships";
import { FeaturedCta } from "@/components/home/FeaturedCta";
import { EligibilityChecker } from "@/components/home/EligibilityChecker";
import { HowToApply } from "@/components/home/HowToApply";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { SuccessStories } from "@/components/home/SuccessStories";
import { NewsEvents } from "@/components/home/NewsEvents";
import { FinalCta } from "@/components/home/FinalCta";
import { SiteFooter } from "@/components/home/SiteFooter";

export const metadata = {
  title: "Neelakannu Educational Trust - Empowering Education, Enabling Dreams",
  description:
    "Neelakannu Educational Trust empowers deserving students with scholarships and financial assistance. Applying for the 2026 scholarship intake is easy.",
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustImpact />
        <About />
        <Scholarships />
        <FeaturedCta />
        <EligibilityChecker />
        <HowToApply />
        <WhyChooseUs />
        <SuccessStories />
        <NewsEvents />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
