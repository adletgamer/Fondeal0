'use client';

import { useEffect } from 'react';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** A small DOM island: the marketing page remains server-rendered and readable without JS. */
export function MarketingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-marketing-root]');
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const revealItems = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
    let revealObserver: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.visible = 'true';
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
      );
      for (const item of revealItems) revealObserver.observe(item);
      root.dataset.motionReady = 'true';
    }

    const hero = root.querySelector<HTMLElement>('[data-hero]');
    const sequence = root.querySelector<HTMLElement>('[data-sequence]');
    const signals = [...root.querySelectorAll<HTMLElement>('[data-sequence-signal]')];
    const card = root.querySelector<HTMLElement>('[data-sequence-card]');
    const progressBar = root.querySelector<HTMLElement>('[data-sequence-progress]');
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduceMotion.matches) return;

      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const progress = clamp(-rect.top / Math.max(rect.height, 1));
          hero.style.setProperty('--hero-back-shift', `${(progress * 24).toFixed(1)}px`);
          hero.style.setProperty('--hero-front-shift', `${(progress * -32).toFixed(1)}px`);
          hero.style.setProperty('--hero-card-shift', `${(progress * 16).toFixed(1)}px`);
        }
      }

      if (!sequence || !card || window.innerWidth <= 760) return;
      const rect = sequence.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const progress = clamp(-rect.top / Math.max(rect.height - window.innerHeight, 1));
      const travel = clamp((progress - 0.08) / 0.72);
      const fade = clamp((progress - 0.48) / 0.34);
      const distance = Math.min(window.innerWidth * 0.21, 260);

      signals.forEach((signal, index) => {
        signal.style.transform = `translate3d(${(travel * distance).toFixed(1)}px, ${((1 - index) * travel * 45).toFixed(1)}px, 0) scale(${(1 - travel * 0.32).toFixed(3)})`;
        signal.style.opacity = `${(1 - fade).toFixed(3)}`;
      });
      card.style.opacity = `${(0.35 + 0.65 * travel).toFixed(3)}`;
      card.style.transform = `scale(${(0.84 + 0.16 * travel).toFixed(3)})`;
      if (progressBar) progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      if (window.innerWidth <= 760) {
        for (const signal of signals) {
          signal.style.removeProperty('transform');
          signal.style.removeProperty('opacity');
        }
        card?.style.removeProperty('transform');
        card?.style.removeProperty('opacity');
      }
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    schedule();

    return () => {
      revealObserver?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
      root.removeAttribute('data-motion-ready');
      for (const item of revealItems) item.removeAttribute('data-visible');
      for (const signal of signals) {
        signal.style.removeProperty('transform');
        signal.style.removeProperty('opacity');
      }
      card?.style.removeProperty('transform');
      card?.style.removeProperty('opacity');
      progressBar?.style.removeProperty('width');
      for (const name of ['--hero-back-shift', '--hero-front-shift', '--hero-card-shift']) {
        hero?.style.removeProperty(name);
      }
    };
  }, []);

  return null;
}
