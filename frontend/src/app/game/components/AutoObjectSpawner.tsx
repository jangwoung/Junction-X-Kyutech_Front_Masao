"use client";

import { useState, useEffect } from 'react';
import { ObjectRenderer } from './ObjectRenderer';
import * as THREE from 'three';

// 使用する画像のパスを配列で定義 背景透過したゴミの画像ならなんでもOK
// ここに好きな画像を追加しても良い
const TRASH_IMAGE_PATHS = [
  './textures/gomi.png',
  './textures/gomi1.png',
  './textures/gomi2.png',
];

// RandomObjectの型定義
type RandomObject = {
  id: number;
  position: [number, number, number];
  color: THREE.Color;
  spawnTime: number; 
  size: number;
  imagePath: string;
};

export function AutoObjectSpawner() {
  const [objects, setObjects] = useState<RandomObject[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setObjects(prevObjects => {
        const newObject: RandomObject = {
          id: Date.now(),
          position: [Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4],
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          spawnTime: Date.now(),
          size: Math.random() * 0.5 + 0.2,
          // 配列からランダムに画像パスを選択して設定
          imagePath: TRASH_IMAGE_PATHS[Math.floor(Math.random() * TRASH_IMAGE_PATHS.length)],
        };
        return [...prevObjects, newObject];
      });
    }, 1000); // 1秒ごとに新しいオブジェクトを生成

    return () => clearInterval(interval);
  }, []);

  // ObjectRendererに生成したobjectsを渡す
  return <ObjectRenderer objects={objects} />;
}