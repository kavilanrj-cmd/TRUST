"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "neelakannu-theme";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  // Restore the saved preference (or fall back to the OS preference) once on mount.
  // The DOM class + state both apply after hydration, so SSR and first hydration
  // render identically (light) and no hydration error or theme flicker occurs.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      // localStorage unavailable — fall through to system preference.
    }
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ? saved === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", initial);
    // One-time external->state sync on mount; not a cascading render concern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(initial);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // ignoring storage errors.
      }
      return next;
    });
  };

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="relative flex h-9 w-[62px] items-center rounded-full border border-gold/30 bg-[#f0e3c4] p-[3px] shadow-sm outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#0f1a30]"
    >
      {/* Sliding knob with crossfading sun/moon */}
      <motion.span
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#0A1F44] shadow-md dark:bg-[#16294a]"
        animate={{ x: dark ? 26 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "moon" : "sun"}
            className="flex"
            initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {dark ? (
              <Moon className="h-4 w-4 text-[#D4AF37]" />
            ) : (
              <Sun className="h-4 w-4 text-[#0A1F44]" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}
