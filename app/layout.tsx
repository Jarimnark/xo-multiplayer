import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XO Battle — Multiplayer Typing Race',
  description: 'Multiplayer Tic-Tac-Toe with typing race turns',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
