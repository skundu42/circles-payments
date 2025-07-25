'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Result,
  Space,
  QRCode,
  message,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useWallet } from '../context/WalletContext';

function isAvatarAlreadyExists(err: unknown): boolean {
  try {
    const e: any = err ?? {};

    const hasName =
      e?.errorName === 'CirclesErrorOneAddressArg' ||
      e?.name === 'CirclesErrorOneAddressArg' ||
      e?.abiError?.name === 'CirclesErrorOneAddressArg';

    if (!hasName) return false;

    const code =
      Number(e?.args?.[1]) ??
      Number(e?.abiError?.args?.[1]) ??
      Number(e?.args?.code) ??
      NaN;

    if (code === 128) return true;

    const raw = JSON.stringify(e);
    return (
      raw.includes('"CirclesErrorOneAddressArg"') &&
      (raw.includes('"128"') || raw.includes(':128'))
    );
  } catch {
    return false;
  }
}
/* ----------------------------------------------------------- */

export default function CreatePage() {
  const { sdk, setOrgAddr, orgAddr } = useWallet();
  const [msgApi, ctx] = message.useMessage();

  async function onFinish(values: { name: string; description?: string }) {
    if (!sdk) {
      msgApi.error('Wallet not connected');
      return;
    }

    try {
      const profile = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      };

      const hide = msgApi.loading('Submitting transaction…', 0);
      const { address } = await sdk.registerOrganizationV2(profile);
      hide();

      setOrgAddr(address);
      msgApi.success('Organisation created');
    } catch (err) {
      if (isAvatarAlreadyExists(err)) {
        msgApi.error(
          'This wallet already has a Circles avatar. ' +
            'Please switch to a fresh wallet or use your existing avatar.'
        );
      } else {
        msgApi.error(
          (err as any)?.shortMessage ||
            (err as any)?.message ||
            'Transaction failed'
        );
      }
    }
  }

  return (
    <>
      {ctx}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Card title="Create a New Organisation" style={{ maxWidth: 500, width: '100%' }}>
          {orgAddr ? (
            <Result
              status="success"
              title="Organisation created!"
              subTitle={
                <Space direction="vertical" size="small" align="center">
                  <code>{orgAddr}</code>
                  <QRCode value={orgAddr} />
                </Space>
              }
              icon={<CheckCircleOutlined />}
            />
          ) : (
            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label="Organisation name"
                name="name"
                rules={[{ required: true, whitespace: true }]}
              >
                <Input placeholder="e.g. Circles Café" allowClear />
              </Form.Item>

              <Form.Item label="Description" name="description">
                <Input.TextArea
                  rows={3}
                  placeholder="Briefly describe what your organisation does"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Create Organisation
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
}