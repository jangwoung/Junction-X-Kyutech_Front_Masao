"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Propsの型定義 ---
interface ArrowKeyUIProps {
  // どのモード（縦回転 or 横回転）かを親から受け取る
  mode: 'horizontal' | 'vertical';
}

/**
 * 押された矢印キーを視覚的に表示し、クリック長押しにも反応するUIコンポーネント
 */
export function ArrowKeyUI({ mode }: ArrowKeyUIProps) {
  // 現在押されているキーの名前を保持するState
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // setIntervalのIDを保持するためのuseRef
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 物理キーボードの入力にUIを反応させるためのuseEffect
  useEffect(() => {
    // キーが押された時の処理
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        setActiveKey(event.key);
      }
    };

    // キーが離された時の処理
    const handleKeyUp = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        setActiveKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // このuseEffectはマウント時に一度だけ実行

  /**
   * 偽のキーボードイベントを発生させるヘルパー関数
   */
  const dispatchKeyEvent = (type: 'keydown' | 'keyup', key: string) => {
    window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true }));
  };

  /**
   * マウスボタンが押された時の処理（連続移動開始）
   */
  const handleMouseDown = (key: string) => {
    // 現在のモードで無効なキーの場合は何もしない
    if (mode === 'horizontal' && !['ArrowUp', 'ArrowDown'].includes(key)) return;
    if (mode === 'vertical' && !['ArrowLeft', 'ArrowRight'].includes(key)) return;
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 1. まず一度、すぐにkeydownイベントを発火
    dispatchKeyEvent('keydown', key);

    // 2. その後、50ミリ秒ごとにkeydownイベントを繰り返し発火させる
    intervalRef.current = setInterval(() => {
      dispatchKeyEvent('keydown', key);
    }, 50);
  };

  /**
   * マウスボタンが離された時の処理（連続移動停止）
   */
  const handleMouseUp = (key: string) => {
    // 現在のモードで無効なキーの場合は何もしない
    if (mode === 'horizontal' && !['ArrowUp', 'ArrowDown'].includes(key)) return;
    if (mode === 'vertical' && !['ArrowLeft', 'ArrowRight'].includes(key)) return;
    
    // 1. 繰り返し処理を停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 2. 最後に一度だけkeyupイベントを発火
    dispatchKeyEvent('keyup', key);
  };

  // --- スタイル定義 ---
  const keyStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50px',
    height: '50px',
    margin: '15px',
    fontSize: '24px',
    backgroundColor: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '5px',
    transition: 'all 0.1s ease',
    userSelect: 'none',
    cursor: 'pointer',
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '40px',
    right: '60px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  // --- レンダリング ---
  return (
    <div style={containerStyle}>
      {/* 上キー */}
      <div 
        style={{
          ...keyStyle,
          backgroundColor: mode === 'horizontal' && activeKey === 'ArrowUp' ? '#666' : '#333',
          transform: mode === 'horizontal' && activeKey === 'ArrowUp' ? 'scale(0.95)' : 'scale(1)',
          opacity: mode === 'vertical' ? 0.4 : 1,
        }}
        onMouseDown={() => handleMouseDown('ArrowUp')}
        onMouseUp={() => handleMouseUp('ArrowUp')}
        onMouseLeave={() => handleMouseUp('ArrowUp')}
      >
        ▲
      </div>
      <div style={{ display: 'flex' }}>
        {/* 左キー */}
        <div 
          style={{
            ...keyStyle,
            backgroundColor: mode === 'vertical' && activeKey === 'ArrowLeft' ? '#666' : '#333',
            transform: mode === 'vertical' && activeKey === 'ArrowLeft' ? 'scale(0.95)' : 'scale(1)',
            opacity: mode === 'horizontal' ? 0.4 : 1,
          }}
          onMouseDown={() => handleMouseDown('ArrowLeft')}
          onMouseUp={() => handleMouseUp('ArrowLeft')}
          onMouseLeave={() => handleMouseUp('ArrowLeft')}
        >
          ◄
        </div>
        {/* 下キー */}
        <div 
          style={{
            ...keyStyle,
            backgroundColor: mode === 'horizontal' && activeKey === 'ArrowDown' ? '#666' : '#333',
            transform: mode === 'horizontal' && activeKey === 'ArrowDown' ? 'scale(0.95)' : 'scale(1)',
            opacity: mode === 'vertical' ? 0.4 : 1,
          }}
          onMouseDown={() => handleMouseDown('ArrowDown')}
          onMouseUp={() => handleMouseUp('ArrowDown')}
          onMouseLeave={() => handleMouseUp('ArrowDown')}
        >
          ▼
        </div>
        {/* 右キー */}
        <div 
          style={{
            ...keyStyle,
            backgroundColor: mode === 'vertical' && activeKey === 'ArrowRight' ? '#666' : '#333',
            transform: mode === 'vertical' && activeKey === 'ArrowRight' ? 'scale(0.95)' : 'scale(1)',
            opacity: mode === 'horizontal' ? 0.4 : 1,
          }}
          onMouseDown={() => handleMouseDown('ArrowRight')}
          onMouseUp={() => handleMouseUp('ArrowRight')}
          onMouseLeave={() => handleMouseUp('ArrowRight')}
        >
          ►
        </div>
      </div>
    </div>
  );
}