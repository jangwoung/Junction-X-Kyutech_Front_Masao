"use client";

import React from "react";

// 3Dシーン内でエラーが発生した場合に、ページ全体がクラッシュするのを防ぐためのコンポーネント
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error in the 3D scene:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', backgroundColor: '#111', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1>An error occurred while rendering the 3D scene.</h1>
          <p>Please check the developer console for more information.</p>
          <pre style={{ color: '#ffaaaa', marginTop: '1rem' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
