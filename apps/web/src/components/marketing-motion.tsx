'use client';

import { useEffect } from 'react';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
    const scrollBar = document.querySelector<HTMLElement>('[data-scroll-progress]');
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduceMotion.matches) return;

      if (scrollBar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const page = clamp(max > 0 ? window.scrollY / max : 0);
        scrollBar.style.width = `${(page * 100).toFixed(2)}%`;
      }

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

    // Pointer-reactive 3D tilt + light sheen on the hero passport card.
    const tiltRoot = root.querySelector<HTMLElement>('[data-tilt-card]');
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const tiltVars = ['--tilt-rx', '--tilt-ry', '--glow-x', '--glow-y', '--glow-opacity'] as const;
    let tiltFrame = 0;
    const tiltTarget = { rx: 0, ry: 0, gx: 50, gy: 30, glow: 0 };
    const tiltCurrent = { rx: 0, ry: 0, gx: 50, gy: 30, glow: 0 };

    const applyTilt = () => {
      tiltCurrent.rx = lerp(tiltCurrent.rx, tiltTarget.rx, 0.12);
      tiltCurrent.ry = lerp(tiltCurrent.ry, tiltTarget.ry, 0.12);
      tiltCurrent.gx = lerp(tiltCurrent.gx, tiltTarget.gx, 0.18);
      tiltCurrent.gy = lerp(tiltCurrent.gy, tiltTarget.gy, 0.18);
      tiltCurrent.glow = lerp(tiltCurrent.glow, tiltTarget.glow, 0.12);

      if (tiltRoot) {
        tiltRoot.style.setProperty('--tilt-rx', `${tiltCurrent.rx.toFixed(2)}deg`);
        tiltRoot.style.setProperty('--tilt-ry', `${tiltCurrent.ry.toFixed(2)}deg`);
        tiltRoot.style.setProperty('--glow-x', `${tiltCurrent.gx.toFixed(1)}%`);
        tiltRoot.style.setProperty('--glow-y', `${tiltCurrent.gy.toFixed(1)}%`);
        tiltRoot.style.setProperty('--glow-opacity', tiltCurrent.glow.toFixed(3));
      }

      const settled =
        Math.abs(tiltCurrent.rx - tiltTarget.rx) < 0.02 &&
        Math.abs(tiltCurrent.ry - tiltTarget.ry) < 0.02 &&
        Math.abs(tiltCurrent.glow - tiltTarget.glow) < 0.004;

      tiltFrame = settled ? 0 : window.requestAnimationFrame(applyTilt);
    };

    const scheduleTilt = () => {
      if (!tiltFrame) tiltFrame = window.requestAnimationFrame(applyTilt);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!tiltRoot) return;
      const rect = tiltRoot.getBoundingClientRect();
      const nx = clamp((event.clientX - rect.left) / Math.max(rect.width, 1));
      const ny = clamp((event.clientY - rect.top) / Math.max(rect.height, 1));
      tiltTarget.ry = (nx - 0.5) * 16;
      tiltTarget.rx = (0.5 - ny) * 16;
      tiltTarget.gx = nx * 100;
      tiltTarget.gy = ny * 100;
      scheduleTilt();
    };
    const onPointerEnter = () => {
      tiltTarget.glow = 1;
      scheduleTilt();
    };
    const onPointerLeave = () => {
      tiltTarget.rx = 0;
      tiltTarget.ry = 0;
      tiltTarget.glow = 0;
      scheduleTilt();
    };

    if (tiltRoot && finePointer) {
      tiltRoot.addEventListener('pointermove', onPointerMove);
      tiltRoot.addEventListener('pointerenter', onPointerEnter);
      tiltRoot.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      revealObserver?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
      if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
      if (tiltRoot && finePointer) {
        tiltRoot.removeEventListener('pointermove', onPointerMove);
        tiltRoot.removeEventListener('pointerenter', onPointerEnter);
        tiltRoot.removeEventListener('pointerleave', onPointerLeave);
        for (const name of tiltVars) tiltRoot.style.removeProperty(name);
      }
      root.removeAttribute('data-motion-ready');
      for (const item of revealItems) item.removeAttribute('data-visible');
      for (const signal of signals) {
        signal.style.removeProperty('transform');
        signal.style.removeProperty('opacity');
      }
      card?.style.removeProperty('transform');
      card?.style.removeProperty('opacity');
      progressBar?.style.removeProperty('width');
      scrollBar?.style.removeProperty('width');
      for (const name of ['--hero-back-shift', '--hero-front-shift', '--hero-card-shift']) {
        hero?.style.removeProperty(name);
      }
    };
  }, []);

  return null;
}
