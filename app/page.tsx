'use client';

import Link from 'next/link';
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Space,
  theme,
} from 'antd';
import {
  PlusCircleOutlined,
  LoginOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  NotificationOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const { token } = theme.useToken();

  const FEATURES = [
    {
      icon: (
        <CheckCircleOutlined
          style={{ fontSize: 40, color: token.colorSuccess }}
        />
      ),
      title: 'Instant Setup',
      desc: 'Create an organisation in under a minute.',
    },
    {
      icon: (
        <WalletOutlined
          style={{ fontSize: 40, color: token.colorPrimary }}
        />
      ),
      title: 'Secure CRC Payments',
      desc: 'Accept and track CRC on Gnosis Chain.',
    },
    {
      icon: (
        <NotificationOutlined
          style={{ fontSize: 40, color: token.colorWarning }}
        />
      ),
      title: 'Real-Time Alerts',
      desc: 'Know the moment funds arrive.',
    },
    {
      icon: (
        <UserSwitchOutlined
          style={{ fontSize: 40, color: token.colorMagenta }}
        />
      ),
      title: 'Trust Control',
      desc: 'Grant or revoke trust with one click.',
    },
  ];

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#fff', // removes dark bars
      }}
    >
      {/* ─────────────────── Hero ─────────────────── */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #eaf3ff 0%, #f5f9ff 100%)',
          padding: '96px 24px',
        }}
      >
        <Row
          gutter={[48, 48]}
          align="middle"
          justify="center"
          style={{ maxWidth: 1200, margin: '0 auto' }}
        >
          <Col xs={24} lg={14}>
            <Title
              style={{
                margin: 0,
                fontSize: 48,
                lineHeight: 1.15,
                color: '#1f1f1f',
              }}
            >
              Accept CRC. Grow&nbsp;local&nbsp;commerce.
            </Title>

            <Paragraph
              style={{
                fontSize: 18,
                marginTop: 24,
                color: '#595959',
              }}
            >
              Circles&nbsp;Pay lets neighbourhood businesses open a CRC
              checkout in minutes—no coding, no hassle.
            </Paragraph>

            <Space
              direction="vertical"
              size="large"
              style={{ marginTop: 32 }}
            >
              <Link href="/create">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusCircleOutlined />}
                >
                  Create Your Circles Org
                </Button>
              </Link>

              <Text style={{ color: '#434343' }}>
                Already have one?{' '}
                <Link href="/connect">
                  <Button
                    type="link"
                    size="large"
                    icon={<LoginOutlined />}
                  >
                    Connect Organisation
                  </Button>
                </Link>
              </Text>
            </Space>
          </Col>

          {/* Illustration (optional) */}
          <Col xs={24} lg={10} style={{ textAlign: 'center' }}>
            <img
              src="/hero.svg"
              alt="Circles Pay"
              style={{ width: '100%', maxWidth: 420 }}
            />
          </Col>
        </Row>
      </section>

      {/* ────────────────── Features ───────────────── */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <Row
          gutter={[48, 48]}
          style={{ maxWidth: 1200, margin: '0 auto' }}
          justify="center"
        >
          {FEATURES.map(({ icon, title, desc }) => (
            <Col xs={24} sm={12} md={6} key={title}>
              <Space
                direction="vertical"
                align="center"
                size="middle"
                style={{ textAlign: 'center' }}
              >
                {icon}
                <Title level={4} style={{ margin: 0, color: '#262626' }}>
                  {title}
                </Title>
                <Paragraph style={{ margin: 0, color: '#595959' }}>
                  {desc}
                </Paragraph>
              </Space>
            </Col>
          ))}
        </Row>
      </section>
    </Layout>
  );
}