import './globals.css';
import type { Metadata } from 'next';
import { WalletProvider } from './context/WalletContext';
import ClientShell from './ClientShell';   

export const metadata: Metadata = {
  title: 'Circles Pay',
  description: 'Accept CRC payments for your businesses'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* server component: MUST return <html> & <body> only */
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <ClientShell>{children}</ClientShell>
        </WalletProvider>
      </body>
    </html>
  );
}