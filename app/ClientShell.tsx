'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { ConfigProvider, Layout, Typography, Tag, Button, theme } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import { useWallet } from './context/WalletContext';
import '@ant-design/v5-patch-for-react-19';

export default function ClientShell({ children }: PropsWithChildren) {
  const { token } = theme.useToken();
  const { address, connect } = useWallet();

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#1677ff' } }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <Typography.Title level={3} style={{ color: 'white', margin: 0, flex: 1 }}>
            Circles&nbsp;Org&nbsp;Creator
          </Typography.Title>

          {/* Connect button or badge */}
          {!address ? (
            <Button
              type="primary"
              icon={<WalletOutlined />}
              onClick={async () => {
                try {
                  await connect();
                } catch (e: any) {
                  // you can show a message here if you want
                  console.error(e.message);
                }
              }}
            >
              Connect MetaMask
            </Button>
          ) : (
            <Tag icon={<WalletOutlined />} color={token.colorPrimary}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </Tag>
          )}
        </Layout.Header>

        <Layout.Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '48px 16px',
          }}
        >
          {children}
        </Layout.Content>

        <Layout.Footer style={{ textAlign: 'center' }}>
          © 2025 Circles Demo • Built with Ant Design
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  );
}