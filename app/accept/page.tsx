'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Form,
  InputNumber,
  Button,
  Typography,
  QRCode,
} from 'antd';
import { useWallet } from '../context/WalletContext';

const { Text, Title } = Typography;

export default function AcceptPage() {
  const { orgAddr } = useWallet();
  const [link, setLink] = useState<string>('');
  const [amount, setAmount] = useState<number | null>(null);

  const onFinish = (values: { amount: number }) => {
    const amt = values.amount;
    const url = `https://app.metri.xyz/transfer/${orgAddr}/crc/${amt}`;
    setAmount(amt);
    setLink(url);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 5,
        }}
      >
        {!orgAddr ? (
          <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <Text>
              You need to{' '}
              <Link href="/create">create</Link> or{' '}
              <Link href="/connect">connect</Link> an organisation first.
            </Text>
          </Card>
        ) : (
          <Card style={{ maxWidth: 800, width: '100%' }}>
            <Row gutter={32} align="middle" justify="center">
              {/* Left: Form */}
              <Col xs={24} md={10} style={{ padding: '0 16px' }}>
                <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                  Amount to Receive
                </Title>
                <Form layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    label="CRC Amount"
                    name="amount"
                    rules={[
                      { required: true, message: 'Please enter an amount' },
                      {
                        type: 'number',
                        min: 0.00000001,
                        message: 'Amount must be greater than zero',
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="e.g. 5"
                      min={0}
                      step={0.0001}
                    />
                  </Form.Item>
                  <Form.Item style={{ textAlign: 'center' }}>
                    <Button type="primary" htmlType="submit">
                      Generate QR
                    </Button>
                  </Form.Item>
                </Form>
              </Col>

              {/* Right: QR Code */}
              <Col xs={24} md={10} style={{ textAlign: 'center', padding: '0 16px' }}>
                {link && amount !== null ? (
                  <>
                    <Title level={4} style={{ marginBottom: 24 }}>
                      Scan to Send {amount} CRC
                    </Title>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <QRCode value={link} size={300} />
                    </div>
                    <Text copyable style={{ display: 'block', marginTop: 16 }}>
                      {link}
                    </Text>
                  </>
                ) : (
                  <Title level={4} style={{ color: '#aaa' }}>
                    Enter an amount to generate QR
                  </Title>
                )}
              </Col>
            </Row>
          </Card>
        )}
      </Layout.Content>
    </Layout>
  );
}