"use client";

import { useHomeContent } from "@/lib/home-content";

export default function AboutPage() {
  const { t } = useHomeContent();
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <span className="eyebrow">{t("about.eyebrow", "About Us")}</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
            {t("about.title", "About Neelakannu Educational Trust")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              "about.intro",
              "Established on 14th November 2018, Neelakannu Educational Trust is a charitable organization dedicated to empowering students through education and scholarship opportunities."
            )}
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t("about.registeredOfficeTitle", "Registered Office")}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(
                "about.address",
                "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India"
              )}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t("about.contactTitle", "Contact Information")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a href={`mailto:${t("about.email", "neelakannueducationaltrust@gmail.com")}`} className="underline hover:text-primary">
                {t("about.email", "neelakannueducationaltrust@gmail.com")}
              </a>
              <br/>
              <span className="underline">{t("about.phone", "94443 27336")}</span>
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t("about.founderTitle", "Founder")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("about.founder", "Prof. Dr. K. Chidambaram")}
          </p>
        </div>

        <div className="pt-12 border-t">
          <h3 className="text-xl font-medium mb-3">{t("about.missionTitle", "Our Mission")}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {t(
              "about.mission",
              "To provide deserving students with financial assistance and educational opportunities, regardless of their economic background, enabling them to pursue their academic dreams and contribute to society."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
