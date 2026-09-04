import { Hero } from "@/components/home/Hero";
import { ApplicationDeadline } from "@/components/home/ApplicationDeadline";
import { TrustImpact } from "@/components/home/TrustImpact";
import { About } from "@/components/home/About";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { Scholarships } from "@/components/home/Scholarships";
import { Notes } from "@/components/home/Notes";
import { DocumentsRequired } from "@/components/home/DocumentsRequired";
import { HowToApply } from "@/components/home/HowToApply";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { SuccessStories } from "@/components/home/SuccessStories";
import { NewsEvents } from "@/components/home/NewsEvents";

export const metadata = {
  title: "Neelakannu Educational Trust - Empowering Education, Enabling Dreams",
  description:
    "Neelakannu Educational Trust empowers deserving students with scholarships and financial assistance. Applying for the 2026 scholarship intake is easy.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ApplicationDeadline />
      <TrustImpact />
      <About />
      <WhatWeDo />
      <Scholarships />
      <Notes />
      <DocumentsRequired />
      <HowToApply />
      <WhyChooseUs />
      <SuccessStories />
      <NewsEvents />
    </>
  );
}
