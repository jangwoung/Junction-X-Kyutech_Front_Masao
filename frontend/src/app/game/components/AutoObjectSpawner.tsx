"use client";

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObjectRenderer } from './ObjectRenderer';

type SpaceObject = {
  id: number;
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  spawnTime: number;
  // Orbital parameters
  axis: THREE.Vector3;
  speed: number;
};

const OBJECT_LIFESPAN = 60; // Increased lifespan to 60 seconds

export function AutoObjectSpawner() {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const timerRef = useRef({ nextSpawnTime: 0 });

  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime();

    // --- Spawning Logic ---
    if (elapsedTime > timerRef.current.nextSpawnTime) {
      const radius = 2 + Math.random() * 4; // Orbit radius between 2 and 6
      const speed = 0.1 + Math.random() * 0.4; // Random speed
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      // Initial position on the orbit
      const initialPosition = new THREE.Vector3(radius, 0, 0);
      // To make the starting point random on the orbital path, we can apply a random initial rotation
      initialPosition.applyAxisAngle(axis, Math.random() * Math.PI * 2);


      const newObject: SpaceObject = {
        id: Date.now(),
        position: initialPosition,
        color: new THREE.Color().setHSL(Math.random(), 0.3, 0.7), // Muted colors
        size: 0.05 + Math.random() * 0.15, // Sizes between 0.05 and 0.2
        spawnTime: elapsedTime,
        axis: axis,
        speed: speed,
      };
      setObjects(prevObjects => [...prevObjects, newObject]);

      const nextInterval = 0.5 + Math.random() * 1; // Spawn more frequently
      timerRef.current.nextSpawnTime = elapsedTime + nextInterval;
    }

    // --- Update and Destruction Logic ---
    setObjects(currentObjects => {
      const updatedObjects = currentObjects.map(obj => {
        // Apply orbital rotation
        obj.position.applyAxisAngle(obj.axis, obj.speed * delta);
        return obj;
      });

      // Filter out old objects
      return updatedObjects.filter(obj => elapsedTime - obj.spawnTime < OBJECT_LIFESPAN);
    });
  });

  // Prepare objects for the renderer (convert Vector3 to array)
  const renderableObjects = objects.map(obj => ({
    ...obj,
    position: obj.position.toArray() as [number, number, number],
  }));

  return <ObjectRenderer objects={renderableObjects} />;
}
