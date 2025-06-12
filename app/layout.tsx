import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Circles Org – v2 Demo',
  description: 'MetaMask login → Circles V2 Org signup → QR output'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}