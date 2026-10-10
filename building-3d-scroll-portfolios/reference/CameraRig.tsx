import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rig, tick } from '../scroll/conductor';
import { ANCHORS, segmentAt, type Vec3 } from './ledger';
import { frame, lerp, smoothstep } from './frame';

/** Scroll progress → camera position/target on Catmull-Rom curves through every anchor. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const mobile = size.width / size.height < 0.85;

  const { posCurve, targetCurve, fovs } = useMemo(() => {
    const v = (k: Vec3) => new THREE.Vector3(...k);
    const pick = (a: (typeof ANCHORS)[number]) => (mobile ? a.camera.mobile : undefined);
    return {
      posCurve: new THREE.CatmullRomCurve3(
        ANCHORS.map((a) => v(pick(a)?.pos ?? a.camera.pos)),
        false,
        'centripetal',
      ),
      targetCurve: new THREE.CatmullRomCurve3(
        ANCHORS.map((a) => v(pick(a)?.target ?? a.camera.target)),
        false,
        'centripetal',
      ),
      fovs: ANCHORS.map((a) => pick(a)?.fov ?? a.camera.fov),
    };
  }, [mobile]);

  const tmp = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), right: new THREE.Vector3() }).current;

  // Runs before every other frame callback (negative priority keeps auto-render).
  useFrame((state, dt) => {
    tick(dt);
    const p = rig.smooth;
    frame.time = state.clock.elapsedTime;
    frame.p = p;
    frame.mobile = mobile;

    const u = p / (ANCHORS.length - 1);
    posCurve.getPoint(u, tmp.pos);
    targetCurve.getPoint(u, tmp.target);
    const { a, b, i, j, t } = segmentAt(p);
    const fov = lerp(fovs[i], fovs[j], smoothstep(0, 1, t));

    // Gentle drift so the model never feels frozen; restrained pointer parallax.
    const drift = rig.reduced ? 0 : 1;
    tmp.pos.x += Math.sin(frame.time * 0.17) * 0.25 * drift;
    tmp.pos.y += Math.sin(frame.time * 0.23) * 0.12 * drift;
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.target);
    tmp.right.setFromMatrixColumn(camera.matrixWorld, 0);
    const amt = Math.min(tmp.pos.distanceTo(tmp.target), 20) * 0.012;
    camera.position.addScaledVector(tmp.right, rig.pointer.x * amt);
    camera.position.y += rig.pointer.y * amt * 0.5;
    camera.lookAt(tmp.target);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    frame.focus.x = tmp.target.x;
    frame.focus.y = tmp.target.y;
    frame.focus.z = tmp.target.z;
    frame.golden = lerp(a.golden, b.golden, t);
    frame.miniature = lerp(a.miniature, b.miniature, smoothstep(0, 1, t));
    frame.stage = lerp(a.stage, b.stage, smoothstep(0.15, 0.85, t));
  }, -1);

  return null;
}
