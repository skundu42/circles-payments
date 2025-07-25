'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layout,
  Typography,
  Button,
  Menu,
  Tag,
  theme,
  message,
  Dropdown,
  Space,
} from 'antd';
import {
  WalletOutlined,
  LogoutOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { useWallet } from '../context/WalletContext';

const PAGES = [
  { key: '/create', label: 'Create Org' },
  { key: '/connect', label: 'Connect Org' },
  { key: '/accept', label: 'Accept CRC' },
  { key: '/transactions', label: 'Transactions' },
  { key: '/trust', label: 'Trust/Untrust' },
];

export default function Header() {
  const { token } = theme.useToken();
  const { address, connect, disconnect } = useWallet();
  const pathname = usePathname();

  // message instance
  const [msgApi, contextHolder] = message.useMessage();

  const menuItems = PAGES.map(({ key, label }) => ({
    key,
    label: <Link href={key}>{label}</Link>,
  }));

  const handleConnect = async () => {
    try {
      await connect();
      msgApi.success('Wallet connected');
    } catch (e: any) {
      msgApi.error(e?.message ?? 'Connection failed');
    }
  };

  const walletMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: disconnect,
      },
    ],
  };

  return (
    <>
      {contextHolder}
      <Layout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: token.colorPrimary,
          height: 64,
        }}
      >
        {/* Brand / logo */}
        <Link href="/" style={{ textDecoration: 'none', marginRight: 24 }}>
          <Typography.Title
            level={3}
            style={{ color: '#fff', margin: 0, cursor: 'pointer' }}
          >
            Circles&nbsp;Pay
          </Typography.Title>
        </Link>

        {/* Navigation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[pathname === '/' ? '/create' : pathname]}
            items={menuItems}
            style={{
              background: 'transparent',
              borderBottom: 'none',
            }}
            overflowedIndicator={<EllipsisOutlined />}
          />
        </div>

        {/* Wallet area */}
        {address ? (
          <Dropdown menu={walletMenu} placement="bottomRight" trigger={['click']}>
            <Tag
              icon={<WalletOutlined />}
              color="#52c41a"
              style={{ marginLeft: 16, cursor: 'pointer', flexShrink: 0 }}
            >
              <Space>
                {address.slice(0, 6)}…{address.slice(-4)}
              </Space>
            </Tag>
          </Dropdown>
        ) : (
          <Button
            icon={<WalletOutlined />}
            type="primary"
            onClick={handleConnect}
            style={{ marginLeft: 16, flexShrink: 0 }}
          >
            Connect&nbsp;Wallet
          </Button>
        )}
      </Layout.Header>
    </>
  );
}