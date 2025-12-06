import React from 'react';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-white overflow-hidden selection:bg-purple-500 selection:text-white">
      <GameCanvas />
    </div>
  );
}