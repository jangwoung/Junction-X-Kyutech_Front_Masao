"use client";

import { useEffect } from "react";

interface CameraKeyboardControllerProps {
  setTargetY: React.Dispatch<React.SetStateAction<number>>;
  step?: number;
}

/**
 * カメラのY座標をキーボードの上下矢印で制御するイベントハンドラコンポーネント
 * @param setTargetY - 親のStateを更新するセッター関数
 * @param step - 1回のキープレスでの移動量（デフォルトは1.0）
 */
export function CameraKeyboardController({ setTargetY, step = 1.0 }: CameraKeyboardControllerProps) {

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