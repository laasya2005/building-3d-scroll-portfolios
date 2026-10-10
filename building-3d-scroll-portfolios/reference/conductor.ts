/* Adapted from MengTo/Skills (MIT License, Copyright (c) 2026 Meng To),
   agent-skills/web-design/build-threejs-scroll-worlds/references/scroll-conductor.js.
   See LICENSE-MengTo-Skills in this folder. */
/* Native-scroll conductor, ported from MengTo/Skills build-threejs-scroll-worlds
   references/scroll-conductor.js. Native document scroll is the single source of
   truth: each [data-anchor] element's centre becomes an integer progress value, and
   scrollY is mapped to a fractional anchor progress (e.g. 3.42).

   `exact` drives navigation, gating and DOM state; `smooth` (damped) drives the
   camera and world. The render loop calls tick() so there is only one RAF. */
import { setState } from '../state/store';

export const rig = {
  exact: 0,
  smooth: 0,
  /** Scroll direction: 1 forward, -1 back. */
  direction: 1,
  anchors: [] as number[],
  count: 1,
  reduced: false,
  /** Pointer in NDC (-1..1), damped. */
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const damp = (c: number, t: number, lambda: number, dt: number) => c + (t - c) * (1 - Math.exp(-lambda * dt));

let sections: HTMLElement[] = [];
let prevY = 0;
let widthAtMeasure = 0;
let ro: ResizeObserver | null = null;

function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

export function measure() {
  const max = maxScroll();
  widthAtMeasure = window.innerWidth;
  const anchors = sections.map((el, i) => {
    if (i === 0) return 0;
    if (i === sections.length - 1) return max;
    const top = el.getBoundingClientRect().top + window.scrollY;
    return clamp(top + el.offsetHeight * 0.5 - window.innerHeight * 0.5, 0, max);
  });
  for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
  rig.anchors = anchors;
  rig.count = anchors.length;
}

export function progressAt(y: number) {
  const a = rig.anchors;
  if (!a.length) return 0;
  y = clamp(y, 0, maxScroll());
  if (y <= a[0]) return 0;
  for (let i = 0; i < a.length - 1; i++) {
    if (y <= a[i + 1]) return i + clamp((y - a[i]) / Math.max(1, a[i + 1] - a[i]), 0, 1);
  }
  return a.length - 1;
}

export function read() {
  const y = window.scrollY;
  const d = y - prevY;
  if (Math.abs(d) > 0.25) rig.direction = d > 0 ? 1 : -1;
  prevY = y;
  rig.exact = progressAt(y);
  setState({ anchor: Math.round(rig.exact) });
}

/** Called once per frame from the render loop. */
export function tick(dt: number) {
  dt = Math.min(dt, 1 / 30);
  rig.smooth = rig.reduced ? rig.exact : damp(rig.smooth, rig.exact, 4.6, dt);
  if (Math.abs(rig.smooth - rig.exact) < 1e-4) rig.smooth = rig.exact;
  const p = rig.pointer;
  const k = rig.reduced ? 0 : 1;
  p.x = damp(p.x, p.tx * k, 3, dt);
  p.y = damp(p.y, p.ty * k, 3, dt);
}

function onResize() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse && window.innerWidth === widthAtMeasure) return;
  measure();
  read();
}

function onPointer(e: PointerEvent) {
  rig.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  rig.pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
}

export function startConductor(reduced: boolean) {
  sections = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor]'));
  rig.reduced = reduced;
  measure();
  prevY = window.scrollY;
  rig.exact = progressAt(prevY);
  rig.smooth = rig.exact;
  setState({ anchor: Math.round(rig.exact) });

  window.addEventListener('scroll', read, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  ro = new ResizeObserver(() => {
    measure();
    read();
  });
  ro.observe(document.body);
  document.fonts?.ready.then(() => {
    measure();
    read();
  });

  return () => {
    window.removeEventListener('scroll', read);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    ro?.disconnect();
  };
}

export function anchorY(i: number) {
  return rig.anchors[clamp(Math.round(i), 0, rig.anchors.length - 1)] ?? 0;
}

if (import.meta.env.DEV) (window as unknown as { __rig: typeof rig }).__rig = rig;
