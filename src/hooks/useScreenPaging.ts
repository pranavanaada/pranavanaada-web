import { useEffect } from 'react';

/** Laptops/desktops only: mouse or trackpad, wide screen, animations allowed. */
const QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const MIN_LOCK_MS = 700; // a turn of the wheel moves one screen, at most this often
const QUIET_MS = 220; // trackpads keep sending "momentum" scrolls after a swipe; wait for them to stop
const OVERFLOW_OK = 0.25; // a section may spill this share of a screen past the bottom and still count as one screen

/**
 * One scroll = one screen: each wheel/trackpad scroll glides to the start of the
 * next (or previous) `.snap-section`. Sections taller than the screen scroll
 * normally until their end is reached. Keyboard scrolling is left as it is.
 * Adds `html.home-snap`, which gives some sections a full-screen layout (index.css).
 */
export function useScreenPaging() {
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const root = document.documentElement;
    const header = document.querySelector('header');
    let lockUntil = 0;

    const headerH = () => header?.getBoundingClientRect().height ?? 72;
    const setHeaderVar = () => root.style.setProperty('--header-h', `${headerH()}px`);

    function stops() {
      const offset = headerH();
      const els = [...document.querySelectorAll<HTMLElement>('.snap-section'), document.querySelector('footer')].filter(
        (el): el is HTMLElement => !!el && el.offsetHeight > 0
      );
      return els.map((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        return { top: Math.max(0, Math.round(top)), bottom: Math.round(top + el.offsetHeight) };
      });
    }

    function onWheel(e: WheelEvent) {
      if (!mq.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const now = performance.now();
      if (now < lockUntil) {
        e.preventDefault();
        lockUntil = Math.max(lockUntil, now + QUIET_MS);
        return;
      }
      if (Math.abs(e.deltaY) < 2) return;

      const y = window.scrollY;
      const view = window.innerHeight - headerH();
      const list = stops();
      let i = list.length - 1;
      while (i > 0 && list[i].top > y + 2) i--;
      const cur = list[i];
      let target: number | null = null;

      if (e.deltaY > 0) {
        // Much more of this section below: scroll normally. A little (short laptop screens) → still move on.
        if (cur && cur.bottom > y + view * (1 + OVERFLOW_OK)) return;
        target = list[i + 1]?.top ?? null;
      } else if (cur && y - cur.top > 2) {
        if (y - cur.top > view) return; // deep inside a tall section: scroll normally
        target = cur.top;
      } else if (i > 0) {
        target = Math.max(list[i - 1].top, list[i - 1].bottom - view); // bottom screen of a tall section
      }
      if (target === null || Math.abs(target - y) < 2) return;

      e.preventDefault();
      lockUntil = now + MIN_LOCK_MS;
      window.scrollTo({ top: target, behavior: 'smooth' });
    }

    setHeaderVar();
    root.classList.add('home-snap');
    window.addEventListener('resize', setHeaderVar);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.classList.remove('home-snap');
      window.removeEventListener('resize', setHeaderVar);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);
}
