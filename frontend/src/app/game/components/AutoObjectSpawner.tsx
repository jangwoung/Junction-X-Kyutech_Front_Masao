"use client";

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObjectRenderer } from './ObjectRenderer';

// 表示したい画像のパスを定義
const TRASH_IMAGE_PATHS = [
  './textures/gomi.png',
  './textures/gomi1.png',
  './textures/gomi2.png',
];

type SpaceObject = {
  id: number;
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  spawnTime: number;
  axis: THREE.Vector3;
  speed: number;
  imagePath: string;
};

// オブジェクトの寿命（秒）
const OBJECT_LIFESPAN = 30;

export function AutoObjectSpawner() {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const timerRef = useRef({ nextSpawnTime: 0 });

  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime();

    // --- Spawning Logic ---
    if (elapsedTime > timerRef.current.nextSpawnTime) {
      const radius = 2 + Math.random() * 4;
      const speed = 0.1 + Math.random() * 0.4;
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      const initialPosition = new THREE.Vector3(radius, 0, 0);
      initialPosition.applyAxisAngle(axis, Math.random() * Math.PI * 2);

      const newObject: SpaceObject = {
        id: Date.now(),
        position: initialPosition,
        color: new THREE.Color().setHSL(Math.random(), 0.3, 0.7),
        size: 0.05 + Math.random() * 0.15,
        spawnTime: elapsedTime,
        axis: axis,
        speed: speed,
        // ランダムな画像パスをオブジェクトに設定
        imagePath: TRASH_IMAGE_PATHS[Math.floor(Math.random() * TRASH_IMAGE_PATHS.length)],
      };
      setObjects(prevObjects => [...prevObjects, newObject]);

      const nextInterval = 0.5 + Math.random() * 1;
      timerRef.current.nextSpawnTime = elapsedTime + nextInterval;
    }

    // --- Update and Destruction Logic ---
    setObjects(currentObjects => {
      const updatedObjects = currentObjects.map(obj => {
        obj.position.applyAxisAngle(obj.axis, obj.speed * delta);
        return obj;
      });
      return updatedObjects.filter(obj => elapsedTime - obj.spawnTime < OBJECT_LIFESPAN);
    });
  });

  // Rendererに渡すためのデータ整形
  const renderableObjects = objects.map(obj => ({
    ...obj,
    position: obj.position.toArray() as [number, number, number],
  }));

  return <ObjectRenderer objects={renderableObjects} />;
}
