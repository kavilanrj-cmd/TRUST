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
            {t("about.title", "Neelakannu Educational Trust")}
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
              <a href={`mailto:${t("about.email", "neelakannueducationaltrust@gmail.com")}`} className="hover:text-primary">
                {t("about.email", "neelakannueducationaltrust@gmail.com")}
              </a>
              <br/>
              <span>{t("about.phone", "94443 27336")}</span>
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

        {/* Core Objectives and Areas of Work - added immediately after Founder per requirements */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.coreObjectivesTitle", "Core Objectives and Areas of Work")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="font-medium">Promotion of Education</li>
            <ul className="pl-6 space-y-1">
              <li>Promote education for all children without discrimination</li>
              <li>Establish, manage, and support schools, colleges, technical institutions, vocational institutions, and non-formal educational centers</li>
              <li>Provide scholarships, grants, books, uniforms, and educational materials to deserving students</li>
              <li>Support rural and tribal education initiatives</li>
              <li>Conduct evening classes, literacy programs, and correspondence courses</li>
              <li>Establish libraries, reading rooms, and knowledge centers</li>
              <li>Publish educational books, periodicals, and literature</li>
              <li>Conduct seminars, lectures, conferences, debates, and academic programs</li>
              <li>Encourage academic excellence through awards, endowments, and scholarships</li>
            </ul>
            <li className="font-medium mt-6">Special Education and Support for Persons with Disabilities</li>
            <ul className="pl-6 space-y-1">
              <li>Provide education for children who are mentally challenged, hearing impaired, visually impaired, or physically disabled</li>
              <li>Provide assistive devices and rehabilitation support</li>
              <li>Promote vocational skills and livelihood opportunities for persons with disabilities</li>
              <li>Extend financial or material assistance to differently-abled individuals</li>
            </ul>
          </ul>
        </div>

        {/* Cultural Promotion and National Integration */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.culturalTitle", "Cultural Promotion and National Integration")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Promote Indian culture, heritage, philosophy, music, yoga, fine arts, and traditional crafts</li>
            <li>Conduct cultural programs, seminars, and discussions</li>
            <li>Preserve and promote national unity through cultural awareness initiatives</li>
          </ul>
        </div>

        {/* Student Welfare and Infrastructure Development */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.welfareTitle", "Student Welfare and Infrastructure Development")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Establish and operate hostels and provide food and accommodation for students</li>
            <li>Create safe and supportive learning environments for disadvantaged children</li>
            <li>Support educational institutions through infrastructure development</li>
          </ul>
        </div>

        {/* Healthcare and Medical Support */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.healthcareTitle", "Healthcare and Medical Support")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Establish, support, and maintain hospitals, dispensaries, laboratories, rehabilitation centers, and healthcare facilities</li>
            <li>Promote research and education in various systems of medicine including Allopathy, Ayurveda, Homeopathy, Naturopathy, and others</li>
            <li>Conduct medical camps, eye camps, and health awareness programs</li>
            <li>Provide medical assistance to economically disadvantaged individuals</li>
            <li>Support training and development of healthcare personnel</li>
          </ul>
        </div>

        {/* Social Welfare and Community Development */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.socialTitle", "Social Welfare and Community Development")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Provide assistance to poor, destitute, elderly, and incapacitated persons</li>
            <li>Establish and maintain homes for the aged</li>
            <li>Provide food, clothing, shelter, and relief during natural disasters and emergencies</li>
            <li>Construct and maintain community centers and public utility infrastructure</li>
            <li>Provide safe drinking water facilities</li>
            <li>Support rural development initiatives</li>
            <li>Assist traditional artisans and craftsmen</li>
          </ul>
        </div>

        {/* Public Benefit and Charitable Activities */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.publicBenefitTitle", "Public Benefit and Charitable Activities")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Provide employment support through development projects</li>
            <li>Support educational and research institutions through grants and donations</li>
            <li>Facilitate establishment and development of public welfare institutions</li>
            <li>Accept donations, gifts, and contributions to further charitable objectives</li>
          </ul>
        </div>

        {/* Target Beneficiaries */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.beneficiariesTitle", "Target Beneficiaries")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Children and students from economically weaker sections</li>
            <li>Persons with disabilities</li>
            <li>Rural and tribal communities</li>
            <li>Women and vulnerable groups</li>
            <li>Elderly individuals</li>
            <li>Illiterate adults</li>
            <li>Poor and destitute populations</li>
          </ul>
        </div>

        {/* Future Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.futureTitle", "Future Plans")}</h2>
          <ul className="text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li>Establishment of educational and vocational training centers</li>
            <li>Expansion of student support and scholarship programs</li>
            <li>Development of healthcare outreach initiatives</li>
            <li>Creation of sustainable livelihood opportunities</li>
            <li>Strengthening rural development activities</li>
            <li>Promotion of inclusive education models</li>
          </ul>
        </div>
      </div>
    </section>
  );
}