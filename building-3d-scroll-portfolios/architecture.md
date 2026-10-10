# Architecture

Stack: Vite + React + TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `gsap` (+ScrollTrigger), `lenis`, `zod`. Deploy on Vercel.

## File layout
```
src/content/      profile.ts, experience.ts, journey.ts, projects.ts, skills.ts   (ALL copy lives here)
src/scroll/       conductor.ts (scroll → progress), lenis.ts (smooth wheel + scrollTo)
src/state/        store.ts (UI state via useSyncExternalStore), game.ts (quests/achievements)
src/world/        Scene.tsx, CameraRig.tsx, ledger.ts, layout.ts, frame.ts, Effects.tsx, materials.ts
src/world/sets/   Landscape.tsx (ground, city, light, gold thread + pawn), Exhibits.tsx, worlds/*
src/ui/           Sections, Journey, Presenter, Hud, Mac (menubar/dock/spotlight), modal
api/              resume-request.ts (Vercel Function)
scripts/          encode-video.sh
```

## Scroll conductor (reference/conductor.ts)
- Every story section has `data-anchor`. Anchor i = scrollY where section i is centred (first = 0, last = max).
- `rig.exact` = fractional anchor index (e.g. 3.42). `rig.smooth` = damped toward exact (lambda ~4.6), set equal under reduced motion.
- Use **exact** for nav highlight, gating clicks, DOM state. Use **smooth** only for camera/visuals.
- Re-measure on fonts ready + ResizeObserver. Never integrate wheel deltas into story position.
- Lenis smooths the wheel but `window.scrollY` stays the source of truth. Call `tick(dt)` from the R3F frame loop (one RAF).

## Anchor ledger (ledger.ts)
```ts
type Anchor = {
  id: string; chapter: ChapterId;
  camera: { pos: Vec3; target: Vec3; fov: number; mobile?: {...} };
  stage: number;   // 1 = presenter large, 0 = bubble
  clip?: Clip;     // one-shot action on arrival
  line: string;    // what the person "says" in the bubble
  golden: number;  // lighting mood 0..1
  level?: number;  // index into journey LEVELS
};
```
Keep anchors and DOM sections in the same order. Generate level anchors from content (`LEVELS.map`). Every camera endpoint is composed for desktop AND given a mobile override.

## Camera rig (reference/CameraRig.tsx)
Two `CatmullRomCurve3`s (position, target) through all anchor keys, `centripetal`. Sample at `smooth / (n-1)`. Lerp FOV with smoothstep. Add tiny drift + clamped pointer parallax. Expose `frame.focus` so the sun's shadow box follows the action.

## Rendering defaults that read as premium
- `flat` canvas (no tone mapping) when the page background must match a video/photo backdrop exactly.
- Scene background + fog colour = page background colour; push fog far when camera climbs for overviews.
- One directional "sun" with 2048 shadow map following `frame.focus`; hemisphere fill; Lightformer environment for metal.
- Post: N8AO (contact shadows) + SMAA only. No bloom on light themes, no tilt-shift.
- Shared materials per family (clay, sand, sage, gold); instancing for anything repeated (buildings, trees, traces, cars).
- `PerformanceMonitor` → lower DPR/AO quality; DPR cap 1.5 mobile, 2 desktop.

## DOM layer
- `main { pointer-events:none }` and re-enable on cards so empty areas pass clicks to the canvas. Sticky wrappers also need `pointer-events:none`.
- Cards: translucent ivory + backdrop blur. Reveal with GSAP ScrollTrigger; hero words masked-rise after the loader.
- Loader waits for: scene compiled (`gl.compile` after Suspense) AND presenter ready, with a 6s fallback.
