/*
Neelakannu Educational Trust - Digital Scholarship & Trust Management Platform
Phase 1A: Foundation
Phase 1B: Public Website

Built with Next.js, TypeScript, Tailwind CSS
*/

import Image from "next/image";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="neelakannu-theme";var s=localStorage.getItem(k);var d=s? s==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}