'use client';

import { useState, useContext } from 'react';
import {
  Tabs,                // ← add this
  Button,
  Card,
  Form,
  Input,
  QRCode,
  Result,
  Space,
  message
} from 'antd';
import {
  WalletOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useWallet } from './context/WalletContext';

// Optional: pull TabPane out if you prefer that syntax
const { TabPane } = Tabs;

export default function Home() {
  const { sdk, orgAddr, setOrgAddr } = useWallet();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState<'create' | 'connect'>('create');

  // Create new org
  const onCreate = async ({ name }: { name: string }) => {
    if (!sdk) return;
    try {
      const hide = messageApi.loading('Submitting transaction…', 0);
      const avatar = await sdk.registerOrganizationV2({ name });
      hide();
      setOrgAddr(avatar.address);
      messageApi.success('Organisation created');
    } catch (e: any) {
      messageApi.error(e.message ?? 'Transaction failed');
    }
  };

  // Connect existing org
  const onConnect = async ({ address }: { address: string }) => {
    if (!sdk) return;
    try {
      const hide = messageApi.loading('Checking organisation…', 0);
      await sdk.getAvatar(address);
      hide();
      setOrgAddr(address);
      messageApi.success('Organisation connected');
    } catch (e: any) {
      messageApi.error('Failed to connect: ' + (e.message ?? String(e)));
    }
  };

  return (
    <>
      {contextHolder}

      <Card style={{ maxWidth: 500, margin: '0 auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as any);
            setOrgAddr(undefined);
          }}
        >
          <TabPane
            key="create"
            tab={
              <span>
                <PlusCircleOutlined /> New Organisation
              </span>
            }
          >
            {orgAddr && activeTab === 'create' ? (
              <Result
                status="success"
                title="Organisation created!"
                subTitle={
                  <Space direction="vertical" size="small" align="center">
                    <span>
                      Address:&nbsp;
                      <code>{orgAddr}</code>
                    </span>
                    <QRCode value={orgAddr} />
                  </Space>
                }
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Form
                layout="vertical"
                onFinish={onCreate}
                autoComplete="off"
                requiredMark={false}
              >
                <Form.Item
                  label="Organisation name"
                  name="name"
                  rules={[{ required: true, whitespace: true }]}
                >
                  <Input placeholder="e.g. Circles Café" allowClear />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PlusCircleOutlined />}
                    block
                  >
                    Register Org
                  </Button>
                </Form.Item>
              </Form>
            )}
          </TabPane>

          <TabPane
            key="connect"
            tab={
              <span>
                <LoginOutlined /> Connect Existing
              </span>
            }
          >
            {orgAddr && activeTab === 'connect' ? (
              <Result
                status="success"
                title="Organisation connected!"
                subTitle={
                  <Space direction="vertical" size="small" align="center">
                    <span>
                      Address:&nbsp;
                      <code>{orgAddr}</code>
                    </span>
                    <QRCode value={orgAddr} />
                  </Space>
                }
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Form
                layout="vertical"
                onFinish={onConnect}
                autoComplete="off"
                requiredMark={false}
              >
                <Form.Item
                  label="Organisation address"
                  name="address"
                  rules={[
                    { required: true },
                    {
                      pattern: /^0x[a-fA-F0-9]{40}$/,
                      message: 'Must be a valid 0x... address',
                    },
                  ]}
                >
                  <Input placeholder="0xABC123…" allowClear />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LoginOutlined />}
                    block
                  >
                    Connect Org
                  </Button>
                </Form.Item>
              </Form>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </>
  );
}