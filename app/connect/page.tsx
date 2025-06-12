'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Result, Space, QRCode, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useWallet } from '../context/WalletContext';

export default function ConnectPage() {
  const { sdk, address: walletAddr, setOrgAddr, orgAddr } = useWallet();
  const [msgApi, ctx] = message.useMessage();
  const [autoConnecting, setAutoConnecting] = useState(false);

  // If wallet is connected and no orgAddr yet, try to auto-connect using wallet address
  useEffect(() => {
    if (!sdk || !walletAddr || orgAddr) return;

    setAutoConnecting(true);
    sdk
      .getAvatar(walletAddr) // throws if not an org avatar
      .then(() => {
        setOrgAddr(walletAddr);
        message.success('Organisation automatically connected from your wallet');
      })
      .catch(() => {
        // wallet has no avatar—do nothing, let user enter an address
      })
      .finally(() => {
        setAutoConnecting(false);
      });
  }, [sdk, walletAddr, orgAddr, setOrgAddr]);

  async function onFinish({ address }: { address: string }) {
    if (!sdk) {
      msgApi.error('Wallet not connected');
      return;
    }
    try {
      const hide = msgApi.loading('Verifying organisation…', 0);
      await sdk.getAvatar(address); // throws if not found
      hide();
      setOrgAddr(address);
      msgApi.success('Organisation connected');
    } catch (e: any) {
      msgApi.error('Connection failed: ' + (e.message ?? String(e)));
    }
  }

  return (
    <>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Card title="Connect an Existing Organisation" style={{ maxWidth: 500, width: '100%' }}>
          {orgAddr ? (
            <Result
              status="success"
              title="Organisation connected!"
              subTitle={
                <Space direction="vertical" size="small" align="center">
                  <code>{orgAddr}</code>
                  <QRCode value={orgAddr} />
                </Space>
              }
              icon={<CheckCircleOutlined />}
            />
          ) : autoConnecting ? (
            <Result
              title="Checking your wallet for an organisation avatar…"
              icon={<CheckCircleOutlined spin />}
            />
          ) : (
            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label="Organisation address"
                name="address"
                rules={[
                  { required: true },
                  {
                    pattern: /^0x[a-fA-F0-9]{40}$/,
                    message: 'Must be a valid 0x… address',
                  },
                ]}
              >
                <Input placeholder="0xABC123…" allowClear />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Connect Organisation
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
}