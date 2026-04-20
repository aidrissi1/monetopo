import * as THREE from "three";
import {
  RING_DISTANCE,
  RING_Y_OFFSET,
  BOX_SIZE,
} from "./geometry";

/** Orient a Y-axis primitive so its axis points along the given normal. */
export function quatFromNormal(normal: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion();
  q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  return q;
}

/**
 * 12 bank satellite positions = 3 stacked horizontal rings of 4 satellites.
 * Returned row-by-row (top-4, middle-4, bottom-4).
 */
export function computeRingPositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const yLevels = [RING_Y_OFFSET, 0, -RING_Y_OFFSET];
  for (const y of yLevels) {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      positions.push(
        new THREE.Vector3(
          Math.cos(angle) * RING_DISTANCE,
          y,
          Math.sin(angle) * RING_DISTANCE
        )
      );
    }
  }
  return positions;
}

/**
 * Compute the entry point on a box's surface for a given bank index,
 * distributing the 12 pipes across the box's 6 faces.
 *  - Top ring (i=0..3)    → +Y face, 2×2 grid
 *  - Bottom ring (i=8..11) → -Y face, 2×2 grid
 *  - Mid ring (i=4..7)    → 4 side faces (+Z, -Z, inner X with two slots)
 */
export function entryPointForBank(
  bankIndex: number,
  boxCenter: THREE.Vector3
): THREE.Vector3 {
  const tier = Math.floor(bankIndex / 4);
  const angleIdx = bankIndex % 4;
  const half = BOX_SIZE[0] / 2;
  const isRightBox = boxCenter.x > 0;
  const innerX = boxCenter.x + (isRightBox ? -half : half);

  const xOffsets = [0.7, 0.7, -0.7, -0.7];
  const zOffsets = [0.7, -0.7, -0.7, 0.7];

  if (tier === 0) {
    return new THREE.Vector3(
      boxCenter.x + xOffsets[angleIdx],
      boxCenter.y + half,
      boxCenter.z + zOffsets[angleIdx]
    );
  }
  if (tier === 2) {
    return new THREE.Vector3(
      boxCenter.x + xOffsets[angleIdx],
      boxCenter.y - half,
      boxCenter.z + zOffsets[angleIdx]
    );
  }
  if (angleIdx === 0) return new THREE.Vector3(innerX, 0.6, boxCenter.z + 0);
  if (angleIdx === 1) return new THREE.Vector3(boxCenter.x, 0, boxCenter.z + half);
  if (angleIdx === 2) return new THREE.Vector3(innerX, -0.6, boxCenter.z + 0);
  return new THREE.Vector3(boxCenter.x, 0, boxCenter.z - half);
}

/**
 * Outward normal of the face that `entry` sits on, for a box at `boxCenter`.
 */
export function faceNormalForEntry(
  entry: THREE.Vector3,
  boxCenter: THREE.Vector3
): THREE.Vector3 {
  const half = BOX_SIZE[0] / 2;
  const dx = entry.x - boxCenter.x;
  const dy = entry.y - boxCenter.y;
  const dz = entry.z - boxCenter.z;
  if (Math.abs(Math.abs(dx) - half) < 1e-3) return new THREE.Vector3(Math.sign(dx), 0, 0);
  if (Math.abs(Math.abs(dy) - half) < 1e-3) return new THREE.Vector3(0, Math.sign(dy), 0);
  return new THREE.Vector3(0, 0, Math.sign(dz));
}
