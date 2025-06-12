import './globals.css';      // adjust path if needed
import type { Metadata } from 'next';
import { WalletProvider } from './context/WalletContext';
import ClientShell from './ClientShell';

export const metadata: Metadata = {
  title: 'Circles Org Creator',
  description: 'Ant-Design dApp to mint Circles V2 organisations'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap in our WalletProvider */}
        <WalletProvider>
          <ClientShell>{children}</ClientShell>
        </WalletProvider>
      </body>
    </html>
  );
}