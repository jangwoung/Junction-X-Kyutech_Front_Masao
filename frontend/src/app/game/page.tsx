"use client";

import GameScene from './components/GameScene';
import NavButton from '@/components/NavButton';

export default function GamePage() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <GameScene />
      <NavButton href="/home">Back to Home</NavButton>
    </div>
  );
}