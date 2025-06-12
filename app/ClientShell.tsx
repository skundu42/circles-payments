'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import Header from './components/Header';
import '@ant-design/v5-patch-for-react-19';

export default function ClientShell({ children }: PropsWithChildren) {
  // Avoid hydration mismatch on the initial server render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <ConfigProvider
      /**
       * Use Ant Design light theme (defaultAlgorithm) so the app background
       * is white. Override the primary colour only.
       */
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#fff' }}>
        <Header />

        {/* Main content area */}
        <Layout.Content style={{ padding: '8px 8px' }}>
          {children}
        </Layout.Content>

        <Layout.Footer style={{ textAlign: 'center', background: '#fafafa' }}>
          Made with ♡ by Gnosis
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  );
}