import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XO Battle — Multiplayer Typing Race',
  description: 'Multiplayer Tic-Tac-Toe with typing race turns',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
