'use client';

import { useEffect } from 'react';

/**
 * Scroll entrances for `[data-reveal]` blocks. Progressive: content is only
 * hidden once this script runs (`html.reveal-ready`), so without JavaScript,
 * with reduced motion, when printing or when a hidden block receives focus,
 * everything is visible.
 */
export function RevealMotion() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const show = (el: Element) => el.classList.add('is-visible');
    const showAll = () => els.forEach(show);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    root.classList.add('reveal-ready');

    const onFocus = (e: FocusEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-reveal]');
      if (el) show(el);
    };
    const onReduce = () => reduce.matches && showAll();
    document.addEventListener('focusin', onFocus);
    window.addEventListener('beforeprint', showAll);
    reduce.addEventListener('change', onReduce);
    return () => {
      io.disconnect();
      root.classList.remove('reveal-ready');
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('beforeprint', showAll);
      reduce.removeEventListener('change', onReduce);
    };
  }, []);
  return null;
}
