# Journey worlds and the game layer

## World recipe (reference/diorama-common.tsx)
Each chapter of the person's story = one **miniature diorama** on a shared collector base (walnut base, brass inlay ring, ivory stage, gold plaque with world name + "LEVEL n · ORG · YEARS"). A gold thread runs between worlds; a pawn walks it and stops at each world's plaque.

Build each world from shared helpers: `Box`, cached `mat(color)`, `Person` (tiny model-railway figure, seated or walking), `Cloud`, `interactive(world, onActivate)`. Hide worlds far from the camera (distance cull) except in overview shots.

### Make every world feel alive (minimum per world)
- 1 landmark that explains the chapter at a glance (circuit board, rocket, mountains + campus, towers for a network company).
- 2-3 moving details (people walking, traffic, clouds, cable car, radar, electrons on traces).
- 1 optional quest with a satisfying payoff animation.
- Text on signs via drei `<Text>` with local woff fonts.

### Theme mapping that worked
| Chapter | World | Quest |
|---|---|---|
| Engineering degree | Circuit Valley (PCB, chips, campus) | flip switch → current flows |
| QA job | Test Lab (desks, dashboard) | squash crawling bugs |
| Master's | Mountain Campus (peaks, campus, trail) | collect certification badges |
| Founding engineer | Launchpad (rocket, gantry) | launch the MVP |
| Industry role | City themed on that industry | light landmarks (one per promotion) |
| Current role | Flagship HQ (most towers, glass tower, drones) | wake the agents |

**The current role must be the biggest, most detailed world** (larger base, more and taller landmarks). Match its industry (e.g. a network company = towers, not an abstract lab) and the company's brand colours.

## Game layer (reference/game-state.ts)
- State: quest progress per world + unlocked achievement ids (persist ids in localStorage, wrapped in try/catch).
- Achievements: quests, milestones (promotions, degree), certifications (placed in the world where they fit). Toasts on unlock; `replay` the toast for an action the visitor just did even if previously unlocked.
- Arrival awards: a level's milestones unlock when the visitor reaches it.
- HUD on desktop only: level name, XP bar (journey progress), trophy count. Trophy case in Skills; real certifications always shown as earned, only optional quests can be locked (show a lock icon, never fade text).
- Every quest has a DOM "Quest" button in the story card that does the same action.

## Common mistakes
- Pawn overlapping interactive geometry at its final stop: end the thread beside, not in front of, the object.
- Big brand sign hidden behind a central prop: raise text above prop height or move the prop forward.
- Camera framing tall worlds: step back/up per world rather than one generic framing.
