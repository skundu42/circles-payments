'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Row,
  Col,
  Layout,
  Card,
  Form,
  Input,
  Button,
  Divider,
  Typography,
  Spin,
  List,
  message,
} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useWallet } from '../context/WalletContext';

export default function TrustPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const { sdk, orgAddr } = useWallet();
  const [orgAvatar, setOrgAvatar] = useState<any>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);

  const [relations, setRelations] = useState<any[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(true);

  const [trustLoading, setTrustLoading] = useState(false);
  const [untrustLoading, setUntrustLoading] = useState(false);

  useEffect(() => {
    if (!sdk || !orgAddr) return;
    setLoadingAvatar(true);
    sdk
      .getAvatar(orgAddr)
      .then(av => setOrgAvatar(av))
      .catch(() => messageApi.error('Failed to load organisation avatar'))
      .finally(() => setLoadingAvatar(false));
  }, [sdk, orgAddr, messageApi]);

  useEffect(() => {
    if (!sdk || !orgAddr) return;
    setLoadingRelations(true);
    sdk.data
      .getAggregatedTrustRelations(orgAddr)
      .then(rows => setRelations(rows))
      .catch(() => messageApi.error('Failed to load trust relations'))
      .finally(() => setLoadingRelations(false));
  }, [sdk, orgAddr, messageApi]);

  if (!orgAddr) {
    return (
      <>
        {contextHolder}
        <Card>
          <Typography.Paragraph>
            You need to <Link href="/create">create</Link> or{' '}
            <Link href="/connect">connect</Link> an organisation first.
          </Typography.Paragraph>
        </Card>
      </>
    );
  }

  if (loadingAvatar || loadingRelations) {
    return (
      <>
        {contextHolder}
        <Card style={{ textAlign: 'center' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Card>
      </>
    );
  }

  const outgoing = relations.filter(
    r =>
      r.subjectAvatar.toLowerCase() === orgAddr.toLowerCase() &&
      r.relation !== 'selfTrusts'
  );
  const incoming = relations.filter(
    r =>
      r.objectAvatar.toLowerCase() === orgAddr.toLowerCase() &&
      r.relation !== 'selfTrusts'
  );

  const onTrust = async (values: { target: string }) => {
    setTrustLoading(true);
    try {
      await orgAvatar.trust(values.target);
      messageApi.success(`${values.target} is now trusted`);
      const rows = await sdk.data.getAggregatedTrustRelations(orgAddr);
      setRelations(rows);
    } catch (e: any) {
      messageApi.error(e?.message || 'Trust failed');
    } finally {
      setTrustLoading(false);
    }
  };

  const onUntrust = async (values: { target: string }) => {
    setUntrustLoading(true);
    try {
      await orgAvatar.untrust(values.target);
      messageApi.success(`${values.target} is now untrusted`);
      const rows = await sdk.data.getAggregatedTrustRelations(orgAddr);
      setRelations(rows);
    } catch (e: any) {
      messageApi.error(e?.message || 'Untrust failed');
    } finally {
      setUntrustLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Layout.Content style={{ padding: 24 }}>
        <Row gutter={24}>
          {/* ─── Left: Trust / Untrust UI ─── */}
          <Col xs={24} md={12}>
            <Card title="Manage Trust">
              <Form layout="vertical" onFinish={onTrust}>
                <Form.Item
                  label="Trust avatar"
                  name="target"
                  rules={[
                    { required: true, message: 'Enter an avatar address' },
                    {
                      pattern: /^0x[a-fA-F0-9]{40}$/,
                      message: 'Must be a valid Ethereum address',
                    },
                  ]}
                >
                  <Input placeholder="0x..." />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={trustLoading}
                    disabled={untrustLoading}
                  >
                    Trust
                  </Button>
                </Form.Item>
              </Form>

              <Divider />

              <Form layout="vertical" onFinish={onUntrust}>
                <Form.Item
                  label="Untrust avatar"
                  name="target"
                  rules={[
                    { required: true, message: 'Enter an avatar address' },
                    {
                      pattern: /^0x[a-fA-F0-9]{40}$/,
                      message: 'Must be a valid Ethereum address',
                    },
                  ]}
                >
                  <Input placeholder="0x..." />
                </Form.Item>
                <Form.Item>
                  <Button
                    danger
                    htmlType="submit"
                    loading={untrustLoading}
                    disabled={trustLoading}
                  >
                    Untrust
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* ─── Right: Incoming & Outgoing Lists ─── */}
          <Col xs={24} md={12}>
            <Card title="Outgoing Trusts">
              {outgoing.length === 0 ? (
                <Typography.Text type="secondary">
                  No avatars you trust.
                </Typography.Text>
              ) : (
                <List
                  dataSource={outgoing}
                  renderItem={item => (
                    <List.Item>
                      <Typography.Text copyable>
                        {item.objectAvatar}
                      </Typography.Text>
                    </List.Item>
                  )}
                />
              )}
            </Card>

            <Card title="Incoming Trusts" style={{ marginTop: 16 }}>
              {incoming.length === 0 ? (
                <Typography.Text type="secondary">
                  No avatars trusting you.
                </Typography.Text>
              ) : (
                <List
                  dataSource={incoming}
                  renderItem={item => (
                    <List.Item>
                      <Typography.Text copyable>
                        {item.subjectAvatar}
                      </Typography.Text>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Layout.Content>
    </>
  );
}