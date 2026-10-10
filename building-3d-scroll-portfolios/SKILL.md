---
name: building-3d-scroll-portfolios
description: Use when building a personal or developer portfolio with Three.js / React Three Fiber, a scroll-driven 3D journey, an animated video avatar of the person, gamified career "levels" or achievements, or when a portfolio feels flat, static, gimmicky or not premium.
---

# Building 3D Scroll Portfolios

## Overview
One persistent WebGL world, driven by native scroll, carries a person's story chapter by chapter; semantic HTML sits on top and carries the meaning. The person is present as a live presenter (a still resting portrait + short action clips). **Premium comes from restraint: one strong idea per screen, a tight palette, crisp rendering, and copy that sounds like the person.**

## When to Use
- "Make my portfolio 3D / interactive / like Bruno Simon / Kage / an Awwwards site"
- Career told as a journey, levels, worlds, or a game
- An avatar of the person that waves and reacts
- Existing portfolio feels static, generic, or "AI-made"

Not for: a single hero effect on an existing site (add one interaction instead).

## Ask first (decisions that change everything)
1. Palette direction (show 3 options). 2. Avatar source: real photos/AI video vs rigged GLB. 3. Story structure: journey chapters vs character-led sections. 4. Hosting/domain. 5. What must stay private (employer details, email, resume).

## Architecture (read `architecture.md`)
| Layer | Pattern | Reference |
|---|---|---|
| Scroll | Native scroll → fractional anchor progress; `exact` for UI, damped `smooth` for camera | `reference/conductor.ts` |
| Story data | Anchor ledger: camera, lighting, presenter size, line per `[data-anchor]` | `architecture.md` |
| Camera | Catmull-Rom through anchor keys, mobile overrides | `reference/CameraRig.tsx` |
| Worlds | One diorama per chapter on a shared plinth | `worlds.md`, `reference/diorama-common.tsx` |
| Game | Optional quests, achievements, toasts, DOM twins | `reference/game-state.ts` |
| Presenter | Still resting portrait + crossfading action clips | `avatar.md` |
| Contact | Resume request form → serverless + Resend | `reference/resume-request.ts` |

## Hard rules (each came from a real failure)
- **Never feather/mask the presenter where it overlaps the body** (arm turns see-through). Washes behind hero text must stop before the portrait.
- **No tilt-shift / depth-of-field on content worlds.** Users read it as "blurry".
- **Copy:** no em/en dashes, no invented metrics, person's own words for About, short plain project names.
- **Privacy:** no personal email, no client/partner/internal feature names; describe projects by skills.
- **Every 3D interaction needs a DOM button twin**; gate 3D clicks to the active chapter.
- **Mobile is a separate composition**, not a shrink: presenter on top, bubble after hero, 16px inputs, cards clear the Dock/bubble, one toast at a time.

## Verify before claiming done (`qa.md`)
Real Chrome (not just SwiftShader) screenshots of every anchor at 1440×900 and iPhone/iPad emulation with touch; every quest; no horizontal overflow; no console errors; contact API rejects bad input.
