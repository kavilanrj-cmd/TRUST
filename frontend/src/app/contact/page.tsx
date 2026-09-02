"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  User,
  PenLine,
  MessageSquare,
  Send,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { useHomeContent } from "@/lib/home-content";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function ContactPage() {
  const { t } = useHomeContent();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const email = t("contact.email", "neelakannueducationaltrust@gmail.com");
  const phone = t("contact.phone", "94443 27336");
  const address = t(
    "contact.address",
    "No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India"
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setSent(false);
    // Simulate a short send (UI only — no backend/database wiring here).
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      e.currentTarget.reset();
    }, 900);
  };

  return (
    <motion.div
      className="bg-surface-muted"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-trust section-pad">
        {/* Back link */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-12"
        >
          <Link href="/" className="underline underline-offset-2 text-navy/80 hover:text-gold-600">
            &larr; Back to Home
          </Link>
        </motion.nav>

        {/* ===== Hero ===== */}
        <motion.header
          className="text-center mb-14"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
        >
          <motion.span variants={fadeUp} className="eyebrow">
            {t("contact.eyebrow", "Contact")}
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-4 font-serif font-bold tracking-tight text-navy"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)" }}
          >
            Contact Us
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            We&rsquo;re here to help. Get in touch with Neelakannu Educational Trust.
          </motion.p>
          {/* subtle gold decorative line */}
          <motion.div
            variants={fadeUp}
            className="mx-auto mt-6 flex items-center justify-center gap-2"
            aria-hidden="true"
          >
            <span className="h-px w-16 bg-gold/40" />
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="h-px w-16 bg-gold/40" />
          </motion.div>
        </motion.header>

        {/* ===== Main 2-column layout ===== */}
        <motion.div
          className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* LEFT column */}
          <div className="space-y-8">
            {/* Trust Office card */}
            <motion.div
              variants={fadeUp}
              className="card-trust rounded-2xl bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-20px_rgba(22,41,74,0.25)] sm:p-8"
            >
              <h2 className="font-serif text-2xl font-bold text-navy">
                {t("contact.officeTitle", "Trust Office")}
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-600">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-navy">Address</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-600">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-navy">Email</p>
                    <a
                      href={`mailto:${email}`}
                      className="mt-1 inline-block text-sm text-muted-foreground transition-colors hover:text-gold-600 hover:underline"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-600">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-navy">Phone</p>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="mt-1 inline-block text-sm text-muted-foreground transition-colors hover:text-gold-600 hover:underline"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact information highlights — Visit Us / Email Us / Call Us */}
            <motion.div
              variants={fadeUp}
              className="grid gap-4 sm:grid-cols-3"
            >
              <HighlightCard
                icon={<MapPin className="h-5 w-5" />}
                title="Visit Us"
                body={
                  <span className="whitespace-pre-line">
                    No. 1/82, Ayyanar Street,
                    {"\n"}
                    Shakthi Ayyanar Nagar,
                    {"\n"}
                    Thiruvanchery,
                    {"\n"}
                    Chennai - 600 126,
                    {"\n"}
                    Tamil Nadu, India
                  </span>
                }
              />
              <HighlightCard
                icon={<Mail className="h-5 w-5" />}
                title="Email Us"
                body={
                  <a
                    href={`mailto:${email}`}
                    className="break-all text-navy underline-offset-2 transition-colors hover:text-gold-600 hover:underline"
                  >
                    {email}
                  </a>
                }
                center
              />
              <HighlightCard
                icon={<Phone className="h-5 w-5" />}
                title="Call Us"
                body={
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-navy underline-offset-2 transition-colors hover:text-gold-600 hover:underline"
                  >
                    {phone}
                  </a>
                }
                center
              />
            </motion.div>

            {/* Need Help card */}
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-2xl bg-navy p-7 text-white shadow-lg transition duration-300 hover:-translate-y-1 sm:p-8"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-navy">
                    <LifeBuoy className="h-6 w-6" />
                  </span>
                  <h3 className="font-serif text-xl font-bold">Need Help?</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Have a question about scholarships, applications, documents, or the Trust? We&rsquo;re happy to help.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:brightness-105"
                  >
                    <Mail className="h-4 w-4" />
                    Email Us
                  </a>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gold/60 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT column — message form */}
          <motion.div
            variants={fadeUp}
            className="card-trust rounded-2xl bg-white p-7 shadow-sm sm:p-8"
          >
            <h2 className="font-serif text-2xl font-bold text-navy">
              {t("contact.messageTitle", "Send Us a Message")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill in the form below and our team will get back to you.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <Field
                id="name"
                label="Full Name"
                icon={<User className="h-5 w-5" />}
                type="text"
                placeholder="Your full name"
              />
              <Field
                id="email"
                label="Email"
                icon={<Mail className="h-5 w-5" />}
                type="email"
                placeholder="your.email@example.com"
              />
              <Field
                id="subject"
                label="Subject"
                icon={<PenLine className="h-5 w-5" />}
                type="text"
                placeholder="Subject"
              />
              <Field
                id="message"
                label="Message"
                icon={<MessageSquare className="h-5 w-5" />}
                type="textarea"
                placeholder="Your message here..."
                rows={5}
              />

              <AnimatePresence>
                {sent && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                  >
                    Message sent successfully. We will get back to you shortly.
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={sending}
                whileHover={{ scale: sending ? 1 : 1.02 }}
                whileTap={{ scale: sending ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-base font-semibold text-navy shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 hover:brightness-105"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        {/* ===== Our Location ===== */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-gold/25 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-gold-600">
                <MapPin className="h-5 w-5" />
              </span>
              <h3 className="font-serif text-2xl font-bold text-navy">Our Location</h3>
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold text-navy">Neelakannu Educational Trust</p>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">{address}</p>
              </div>
              <div className="flex items-start md:justify-end">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold-soft"
                >
                  <MapPin className="h-4 w-4 text-gold-600" />
                  View on Map
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== Quick Links (retained from existing page) ===== */}
        <motion.div
          className="pt-12 mt-14 border-t border-border"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-xl font-medium mb-4 text-navy">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <li><Link href="/" className="underline underline-offset-2 hover:text-gold-600">Home</Link></li>
            <li><Link href="/about" className="underline underline-offset-2 hover:text-gold-600">About</Link></li>
            <li><Link href="/vision-mission" className="underline underline-offset-2 hover:text-gold-600">Vision & Mission</Link></li>
            <li><Link href="/scholarship" className="underline underline-offset-2 hover:text-gold-600">Scholarship</Link></li>
            <li><Link href="/announcements" className="underline underline-offset-2 hover:text-gold-600">Announcements</Link></li>
            <li><Link href="/contact" className="underline underline-offset-2 hover:text-gold-600">Contact</Link></li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

function HighlightCard({
  icon,
  title,
  body,
  center,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  center?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`card-trust rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-[0_14px_30px_-16px_rgba(22,41,74,0.25)] ${
        center ? "flex flex-col items-center text-center" : ""
      }`}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-gold-600">
        {icon}
      </span>
      <h4 className="mt-4 text-sm font-bold text-navy">{title}</h4>
      <div className="mt-2 text-sm text-muted-foreground">{body}</div>
    </motion.div>
  );
}

function Field({
  id,
  label,
  icon,
  type,
  placeholder,
  rows,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "text" | "email" | "textarea";
  placeholder: string;
  rows?: number;
}) {
  const baseInput =
    "w-full rounded-xl border border-border bg-white py-3 pl-12 pr-4 text-navy shadow-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-gold focus:ring-4 focus:ring-gold/15";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          {icon}
        </span>
        {type === "textarea" ? (
          <motion.textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            whileFocus={{ scale: 1.01 }}
            className={`${baseInput} pt-3`}
          />
        ) : (
          <motion.input
            id={id}
            type={type}
            placeholder={placeholder}
            whileFocus={{ scale: 1.01 }}
            className={baseInput}
          />
        )}
      </div>
    </div>
  );
}
