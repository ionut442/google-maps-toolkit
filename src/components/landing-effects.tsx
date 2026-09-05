"use client";

import { useEffect } from "react";
import styles from "@/app/landing.module.css";

export function LandingEffects() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(
      `.${styles.marketingHeader}`,
    );
    const onScroll = () =>
      header?.classList.toggle("is-scrolled", window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const targets = document.querySelectorAll<HTMLElement>(
      `.${styles.page} main section > .${styles.container}`,
    );
    targets.forEach((target) => target.classList.add("qwen-reveal"));

    const observer = reduced
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 },
        );

    targets.forEach((target) => {
      if (reduced) target.classList.add("is-visible");
      else observer?.observe(target);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  return null;
}
