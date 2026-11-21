// component/ScrollReveal.tsx
// Shows the page's [data-reveal] elements as they scroll into view (styles in
// globals.css). Everything is visible until this runs: it only hides what is
// still below the screen, so a failed script never hides the page. Elements
// that come into view together arrive one after another (a short, capped stagger).
'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/** Between elements arriving together, and how many steps at most. */
const STAGGER_MS = 80;
const MAX_STEPS = 4;
/** After this the element's own transitions (hover...) take over again. */
const SETTLE_MS = 1700;

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-reveal]:not([data-revealed])',
      ),
    );
    if (elements.length === 0 || !('IntersectionObserver' in window)) return;

    // Already on screen (or above it, e.g. a reload halfway down): shown as they are.
    const screen = window.innerHeight;
    const waiting = elements.filter((el) => {
      if (el.getBoundingClientRect().top < screen * 0.9) {
        el.dataset.revealed = 'done';
        return false;
      }
      return true;
    });
    root.classList.add('reveal-on');

    const timers: number[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          // Reading order, so a row of cards fills in from its first one.
          .sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1,
          );
        arriving.forEach((el, i) => {
          observer.unobserve(el);
          const delay = Math.min(i, MAX_STEPS) * STAGGER_MS;
          el.style.setProperty('--reveal-delay', `${delay}ms`);
          el.dataset.revealed = 'in';
          timers.push(
            window.setTimeout(() => {
              el.dataset.revealed = 'done';
              el.style.removeProperty('--reveal-delay');
            }, SETTLE_MS + delay),
          );
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    );
    waiting.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  return null;
}
