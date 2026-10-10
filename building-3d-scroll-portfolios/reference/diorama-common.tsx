import { useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE, PLINTH_H, type World } from '../../layout';
import { MAT } from '../../materials';
import { FONT_URL } from '../../textures';
import { frame } from '../../frame';
import { ANCHORS } from '../../ledger';
import { LEVELS, type WorldId } from '../../../content/journey';
import { getState } from '../../../state/store';

/* Shared pieces for the miniature dioramas. */

const cache = new Map<string, THREE.MeshStandardMaterial>();
/** Cached matte material per colour (keeps draw state small and consistent). */
export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; ei?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.85}|${opts.metal ?? 0}|${opts.emissive ?? ''}|${opts.ei ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? 0,
    });
    cache.set(key, m);
  }
  return m;
}

/** True while the visitor is on one of this world's levels (gates interactions). */
export function isWorldActive(world: WorldId) {
  const a = ANCHORS[getState().anchor];
  return a?.level !== undefined && LEVELS[a.level].world === world;
}

/** Click/hover handlers for an interactive prop, gated to its world. */
export function interactive(world: WorldId, onActivate: () => void) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!isWorldActive(world)) return;
      e.stopPropagation();
      document.body.dataset.hover = '1';
    },
    onPointerOut: () => {
      delete document.body.dataset.hover;
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!isWorldActive(world)) return;
      e.stopPropagation();
      onActivate();
    },
  };
}

export function Box({
  p,
  s,
  c,
  r = [0, 0, 0],
  m,
  cast = true,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c?: string;
  r?: [number, number, number];
  m?: THREE.Material;
  cast?: boolean;
}) {
  return (
    <mesh position={p} rotation={r} material={m ?? mat(c ?? PALETTE.clay)} castShadow={cast} receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

/** A round museum plinth with a gold rim and a level plaque; children sit on top (y = 0). */
export function Diorama({
  world,
  ground,
  title,
  caption,
  children,
}: {
  world: World;
  ground: string;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  // Only draw worlds near the camera; the map view (About) and contact see them all.
  useFrame((state) => {
    const d = state.camera.position.distanceTo(group.current!.position);
    group.current!.visible = d < 95 || state.camera.position.y > 25;
  });
  const { r } = world;
  return (
    <group ref={group} position={[world.x, 0, world.z]}>
      {/* collector's display: walnut base, brass inlay, ivory stage */}
      <mesh position-y={0.24} material={WALNUT} castShadow receiveShadow>
        <cylinderGeometry args={[r + 0.45, r + 0.6, 0.48, 80]} />
      </mesh>
      <mesh position-y={0.49} rotation-x={Math.PI / 2} material={MAT.gold}>
        <torusGeometry args={[r + 0.42, 0.035, 8, 120]} />
      </mesh>
      <mesh position-y={0.48 + (PLINTH_H - 0.48) / 2} material={MAT.clay} castShadow receiveShadow>
        <cylinderGeometry args={[r, r + 0.08, PLINTH_H - 0.48, 80]} />
      </mesh>
      <mesh position-y={PLINTH_H + 0.03} material={mat(ground, { rough: 0.95 })} receiveShadow>
        <cylinderGeometry args={[r - 0.3, r - 0.3, 0.06, 72]} />
      </mesh>
      <mesh position-y={PLINTH_H + 0.02} rotation-x={Math.PI / 2} material={MAT.gold}>
        <torusGeometry args={[r - 0.15, 0.06, 8, 96]} />
      </mesh>
      {/* plaque */}
      <group position={[0, 0.25, r + 0.62]} rotation-x={-0.12}>
        <mesh material={MAT.goldSatin} castShadow>
          <boxGeometry args={[4.4, 0.78, 0.06]} />
        </mesh>
        <Text font={FONT_URL.serif} fontSize={0.34} position={[0, 0.1, 0.04]} color="#1E150A" anchorX="center" anchorY="middle">
          {title}
        </Text>
        <Text font={FONT_URL.mono} fontSize={0.12} position={[0, -0.22, 0.04]} color="#3B2E1C" anchorX="center" anchorY="middle" letterSpacing={0.12}>
          {caption}
        </Text>
      </group>
      <group position-y={PLINTH_H + 0.06}>{children}</group>
    </group>
  );
}

const WALNUT = new THREE.MeshStandardMaterial({ color: '#5E4130', roughness: 0.48, metalness: 0.05 });

const SKIN = ['#C98E6B', '#A86F4E', '#E2B193', '#8A5A3C'];
/** A tiny model-railway person. Seated people sit at desk height; walkers loop a path. */
export function Person({
  p,
  shirt = '#4B6A8A',
  seated = false,
  walk,
  rot = 0,
  i = 0,
}: {
  p: [number, number, number];
  shirt?: string;
  seated?: boolean;
  /** Walk a circle of this radius around p. */
  walk?: number;
  rot?: number;
  i?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = frame.time * 0.35 + i * 1.7;
    if (walk) {
      g.current!.position.set(p[0] + Math.cos(t) * walk, p[1], p[2] + Math.sin(t) * walk);
      g.current!.rotation.y = -t;
      const swing = Math.sin(frame.time * 7 + i) * 0.5;
      legL.current!.rotation.x = swing;
      legR.current!.rotation.x = -swing;
    } else {
      g.current!.position.y = p[1] + Math.sin(frame.time * 1.6 + i) * 0.006;
    }
  });
  const skin = mat(SKIN[i % SKIN.length], { rough: 0.6 });
  const pants = mat('#2E2A27');
  return (
    <group ref={g} position={p} rotation-y={rot} scale={0.62}>
      {!seated && (
        <>
          <mesh ref={legL} position={[-0.09, 0.42, 0]} material={pants} castShadow>
            <boxGeometry args={[0.12, 0.84, 0.13]} />
          </mesh>
          <mesh ref={legR} position={[0.09, 0.42, 0]} material={pants} castShadow>
            <boxGeometry args={[0.12, 0.84, 0.13]} />
          </mesh>
        </>
      )}
      <mesh position-y={seated ? 0.55 : 1.12} material={mat(shirt, { rough: 0.7 })} castShadow>
        <capsuleGeometry args={[0.17, 0.42, 6, 12]} />
      </mesh>
      <mesh position-y={seated ? 1.0 : 1.57} material={skin} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
      </mesh>
      <mesh position={[0, seated ? 1.06 : 1.63, -0.03]} material={mat('#2A1D16')}>
        <sphereGeometry args={[0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

/** A soft, drifting cloud made of a few spheres. */
export function Cloud({ p, s = 1, drift = 1.5, i = 0 }: { p: [number, number, number]; s?: number; drift?: number; i?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    g.current!.position.x = p[0] + Math.sin(frame.time * 0.12 + i) * drift;
  });
  const m = mat('#FFFFFF', { rough: 1 });
  return (
    <group ref={g} position={p} scale={s}>
      {[
        [0, 0, 0, 0.7],
        [0.6, -0.1, 0.1, 0.5],
        [-0.6, -0.12, 0, 0.55],
        [0.2, 0.3, -0.1, 0.5],
      ].map(([x, y, z, r], k) => (
        <mesh key={k} position={[x, y, z]} material={m} castShadow>
          <sphereGeometry args={[r, 18, 14]} />
        </mesh>
      ))}
    </group>
  );
}

/** Mutable per-frame helper: damp a value toward a target. */
export const damp = (cur: number, to: number, l: number, dt: number) => THREE.MathUtils.damp(cur, to, l, dt);

export { frame };
