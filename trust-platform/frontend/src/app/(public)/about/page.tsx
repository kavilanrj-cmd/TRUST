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
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">{t("about.founderTitle", "Founder")}</h2>
          <div className="text-muted-foreground mb-4">
            <p className="font-serif text-xl font-bold leading-tight">
              {t("about.founder", "Prof. Dr. K. Chidambaram")}
            </p>
            <p className="text-sm font-medium tracking-wider dark:text-gold">
              {t("about.founder.subheading", "Founder and Settlor")}
            </p>
          </div>
        </div>

        <div className="pt-6">
          <p className="text-muted-foreground leading-relaxed">
            {t("about.founder.para1", "Neelakannu Educational Trust was established under the visionary leadership of Prof. Dr. K. Chidambaram, an eminent educationist who served as a Principal of many leading engineering colleges for over three decades, besides serving as a Dean of an University. He is on the board as an advisor of many engineering colleges and Technical Institutions. With more than 40 years of experience in academic administration and student development, he has made significant contributions to higher education and institutional growth.")}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4" style={{ textAlign: 'justify' }}>
            {t("about.founder.para2", "Driven by a lifelong commitment to education, discipline, and social responsibility, Prof. Dr. Chidambaram founded the Trust to extend educational opportunities and welfare support to underserved sections of society. The Trust embodies his vision of empowering individuals through knowledge, values, and inclusive development.")}
          </p>
        </div>

        {/* Core Objectives and Areas of Work - added immediately after Founder per requirements */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.coreObjectivesTitle", "Core Objectives and Areas of Work")}</h2>
          <h3 className="text-xl font-semibold mb-3 dark:text-white">Promotion of Education</h3>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Promote education for all children without discrimination</li>
            <li className="pl-1">Establish, manage, and support schools, colleges, technical institutions, vocational institutions, and non-formal educational centers</li>
            <li className="pl-1">Provide scholarships, grants, books, uniforms, and educational materials to deserving students</li>
            <li className="pl-1">Support rural and tribal education initiatives</li>
            <li className="pl-1">Conduct evening classes, literacy programs, and correspondence courses</li>
            <li className="pl-1">Establish libraries, reading rooms, and knowledge centers</li>
            <li className="pl-1">Publish educational books, periodicals, and literature</li>
            <li className="pl-1">Conduct seminars, lectures, conferences, debates, and academic programs</li>
            <li className="pl-1">Encourage academic excellence through awards, endowments, and scholarships</li>
          </ul>
          <h3 className="text-xl font-semibold mb-3 mt-8 dark:text-white">Special Education and Support for Persons with Disabilities</h3>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Provide education for children who are mentally challenged, hearing impaired, visually impaired, or physically disabled</li>
            <li className="pl-1">Provide assistive devices and rehabilitation support</li>
            <li className="pl-1">Promote vocational skills and livelihood opportunities for persons with disabilities</li>
            <li className="pl-1">Extend financial or material assistance to differently-abled individuals</li>
          </ul>
        </div>

        {/* Cultural Promotion and National Integration */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.culturalTitle", "Cultural Promotion and National Integration")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Promote Indian culture, heritage, philosophy, music, yoga, fine arts, and traditional crafts</li>
            <li className="pl-1">Conduct cultural programs, seminars, and discussions</li>
            <li className="pl-1">Preserve and promote national unity through cultural awareness initiatives</li>
          </ul>
        </div>

        {/* Student Welfare and Infrastructure Development */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.welfareTitle", "Student Welfare and Infrastructure Development")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Establish and operate hostels and provide food and accommodation for students</li>
            <li className="pl-1">Create safe and supportive learning environments for disadvantaged children</li>
            <li className="pl-1">Support educational institutions through infrastructure development</li>
          </ul>
        </div>

        {/* Healthcare and Medical Support */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.healthcareTitle", "Healthcare and Medical Support")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Establish, support, and maintain hospitals, dispensaries, laboratories, rehabilitation centers, and healthcare facilities</li>
            <li className="pl-1">Promote research and education in various systems of medicine including Allopathy, Ayurveda, Homeopathy, Naturopathy, and others</li>
            <li className="pl-1">Conduct medical camps, eye camps, and health awareness programs</li>
            <li className="pl-1">Provide medical assistance to economically disadvantaged individuals</li>
            <li className="pl-1">Support training and development of healthcare personnel</li>
          </ul>
        </div>

        {/* Social Welfare and Community Development */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.socialTitle", "Social Welfare and Community Development")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Provide assistance to poor, destitute, elderly, and incapacitated persons</li>
            <li className="pl-1">Establish and maintain homes for the aged</li>
            <li className="pl-1">Provide food, clothing, shelter, and relief during natural disasters and emergencies</li>
            <li className="pl-1">Construct and maintain community centers and public utility infrastructure</li>
            <li className="pl-1">Provide safe drinking water facilities</li>
            <li className="pl-1">Support rural development initiatives</li>
            <li className="pl-1">Assist traditional artisans and craftsmen</li>
          </ul>
        </div>

        {/* Public Benefit and Charitable Activities */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.publicBenefitTitle", "Public Benefit and Charitable Activities")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Provide employment support through development projects</li>
            <li className="pl-1">Support educational and research institutions through grants and donations</li>
            <li className="pl-1">Facilitate establishment and development of public welfare institutions</li>
            <li className="pl-1">Accept donations, gifts, and contributions to further charitable objectives</li>
          </ul>
        </div>

        {/* Target Beneficiaries */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.beneficiariesTitle", "Target Beneficiaries")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Children and students from economically weaker sections</li>
            <li className="pl-1">Persons with disabilities</li>
            <li className="pl-1">Rural and tribal communities</li>
            <li className="pl-1">Women and vulnerable groups</li>
            <li className="pl-1">Elderly individuals</li>
            <li className="pl-1">Illiterate adults</li>
            <li className="pl-1">Poor and destitute populations</li>
          </ul>
        </div>

        {/* Future Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{t("about.futureTitle", "Future Plans")}</h2>
          <ul className="list-disc pl-6 text-muted-foreground dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="pl-1">Establishment of educational and vocational training centers</li>
            <li className="pl-1">Expansion of student support and scholarship programs</li>
            <li className="pl-1">Development of healthcare outreach initiatives</li>
            <li className="pl-1">Creation of sustainable livelihood opportunities</li>
            <li className="pl-1">Strengthening rural development activities</li>
            <li className="pl-1">Promotion of inclusive education models</li>
          </ul>
        </div>
      </div>
    </section>
  );
}