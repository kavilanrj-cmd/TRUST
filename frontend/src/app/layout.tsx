/*
Neelakannu Educational Trust - Digital Scholarship & Trust Management Platform
Phase 1A: Foundation
Phase 1B: Public Website

Built with Next.js, TypeScript, Tailwind CSS
*/

import Image from "next/image";

export const metadata = {
  title: "Neelakannu Educational Trust - Digital Scholarship Platform",
  description: "Scholarship and trust management platform for Neelakannu Educational Trust, Chennai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-background text-foreground"
    >
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}