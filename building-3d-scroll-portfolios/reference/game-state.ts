import { useSyncExternalStore } from 'react';
import { ACHIEVEMENTS, type AchievementId } from '../content/journey';

/* Journey game state: quest progress per world and unlocked achievements.
   Achievements persist per viewer in localStorage (a convenience only). */

export type Toast = { key: number; id: AchievementId; title: string; detail: string; kind: string };

type GameState = {
  unlocked: AchievementId[];
  toasts: Toast[];
  powered: boolean;
  squashed: number[]; // which test-lab bugs are gone
  badges: AchievementId[]; // collected on the mountain
  launched: boolean;
  towers: boolean[];
  agentsAwake: boolean;
};

export const BUG_COUNT = 6;
const KEY = 'portfolio-journey-v1';

function loadUnlocked(): AchievementId[] {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as AchievementId[]) : [];
    return ids.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
  } catch {
    return [];
  }
}

let state: GameState = {
  unlocked: [],
  toasts: [],
  powered: false,
  squashed: [],
  badges: [],
  launched: false,
  towers: [false, false, false],
  agentsAwake: false,
};
// Returning visitors keep their trophies, but every world replays fresh.
if (typeof window !== 'undefined') state.unlocked = loadUnlocked();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getGame() {
  return state;
}

export function setGame(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  emit();
}

let toastKey = 0;
/** Unlock an achievement. `replay` shows the toast again for something the
    visitor just did, even if it was unlocked on an earlier visit. */
export function unlock(id: AchievementId, replay = false) {
  const known = state.unlocked.includes(id);
  if (known && !replay) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
  const unlocked = known ? state.unlocked : [...state.unlocked, id];
  const toast: Toast = { key: ++toastKey, id, title: a.title, detail: a.detail, kind: a.kind };
  state = { ...state, unlocked, toasts: [...state.toasts, toast].slice(-3) };
  emit();
  try {
    localStorage.setItem(KEY, JSON.stringify(unlocked));
  } catch {
    /* private mode: trophies just won't persist */
  }
  setTimeout(() => {
    state = { ...state, toasts: state.toasts.filter((t) => t.key !== toast.key) };
    emit();
  }, 4200);
}

/** Award several with a small stagger so toasts read one by one. */
export function unlockMany(ids: AchievementId[]) {
  ids.forEach((id, i) => setTimeout(() => unlock(id), i * 650));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/* ---- Quest actions (shared by 3D objects and their DOM twins) ---- */
export const quests = {
  power() {
    if (state.powered) return;
    setGame({ powered: true });
    unlock('power-on', true);
  },
  squash(i: number) {
    if (state.squashed.includes(i)) return;
    const squashed = [...state.squashed, i];
    setGame({ squashed });
    if (squashed.length === BUG_COUNT) unlock('zero-bugs', true);
  },
  /** DOM twin: squash the next remaining bug. */
  squashNext() {
    const i = Array.from({ length: BUG_COUNT }, (_, k) => k).find((k) => !state.squashed.includes(k));
    if (i !== undefined) quests.squash(i);
  },
  collect(id: AchievementId) {
    if (state.badges.includes(id)) return;
    setGame({ badges: [...state.badges, id] });
    unlock(id, true);
  },
  launch() {
    if (state.launched) return;
    setGame({ launched: true });
    setTimeout(() => unlock('ship-it', true), 1400);
  },
  tower(i: number) {
    const towers = state.towers.map((t, k) => t || k === i);
    setGame({ towers });
    if (towers.every(Boolean)) unlock('towers');
  },
  wake() {
    if (state.agentsAwake) return;
    setGame({ agentsAwake: true });
    unlock('agents', true);
  },
};
