"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';

// add typed props
type SetState<T> = (updater: (prev: T) => T) => void;
export type CameraTrackerProps = {
  setPosition: SetState<THREE.Vector3>;
  setRotation: SetState<THREE.Euler>;
};

export function CameraTracker({ setPosition, setRotation }: CameraTrackerProps) {
  const { camera } = useThree();
  useFrame(() => {
    const posArray = camera.position.clone().toArray().map(v => parseFloat(v.toFixed(2)));
    const euler = camera.rotation.clone();
    const rotArray = [
        parseFloat(euler.x.toFixed(2)),
        parseFloat(euler.y.toFixed(2)),
        parseFloat(euler.z.toFixed(2))
    ];
    
    setPosition(prev => {
        const newPos = new THREE.Vector3(...posArray);
        return JSON.stringify(prev) !== JSON.stringify(newPos) ? newPos : prev;
    });
    setRotation(prev => {
        const newRot = new THREE.Euler(...rotArray);
        return JSON.stringify(prev) !== JSON.stringify(newRot) ? newRot : prev;
    });
  });
  return null;
}

export type CameraDisplayProps = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

export function CameraDisplay({ position, rotation }: CameraDisplayProps) {
  const toDegrees = (rad: number) => (rad * 180 / Math.PI).toFixed(1);

  return (
    <div style={{
        position: 'absolute', bottom: '1rem', left: '1rem', color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '0.5rem',
        fontFamily: 'monospace', fontSize: '0.8rem', pointerEvents: 'none'
    }}>
        <div>Cam Pos: {`X: ${position.x}, Y: ${position.y}, Z: ${position.z}`}</div>
        <div>Cam Rot (°): {`X: ${toDegrees(rotation.x)}, Y: ${toDegrees(rotation.y)}, Z: ${toDegrees(rotation.z)}`}</div>
    </div>
  );
}
