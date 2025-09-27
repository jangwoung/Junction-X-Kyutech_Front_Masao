"use client";

import { useEffect } from "react";

interface VerticalCameraKeyboardControllerProps {
  setTargetY: React.Dispatch<React.SetStateAction<number>>;
  step?: number;
}

export function VerticalCameraKeyboardController({ setTargetY, step = 1.0 }: VerticalCameraKeyboardControllerProps) {

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setTargetY(y => y + step);
      } else if (event.key === 'ArrowDown') {
        setTargetY(y => y - step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTargetY, step]);

  return null;
}


interface HorizontalCameraKeyboardControllerProps {
  setTargetX: React.Dispatch<React.SetStateAction<number>>;
  step?: number;
}

export function HorizontalCameraKeyboardController({ setTargetX, step = 1.0 }: HorizontalCameraKeyboardControllerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setTargetX(x => x + step);
      } else if (event.key === 'ArrowLeft') {
        setTargetX(x => x - step);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTargetX, step]);

  return null;
}