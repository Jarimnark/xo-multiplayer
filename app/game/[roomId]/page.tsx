import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GameRoom = dynamic(() => import('./GameRoom'), { ssr: false });

export default function GamePage({ params }: { params: { roomId: string } }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-white/30 font-mono animate-pulse">Loading game...</p>
        </main>
      }
    >
      <GameRoom roomId={params.roomId} />
    </Suspense>
  );
}
