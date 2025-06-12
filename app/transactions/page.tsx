'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Typography,
  Spin,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useWallet } from '../context/WalletContext';

const { Text } = Typography;
const PAGE_SIZE = 20;

function truncate(str: string) {
  return `${str.slice(0, 6)}…${str.slice(-4)}`;
}

export default function TransactionsPage() {
  const { sdk, orgAddr } = useWallet();

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyQuery, setHistoryQuery] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const refreshRef = useRef<NodeJS.Timer>();

  /* ---------- helpers ---------- */
  const loadTransactions = async () => {
    if (!sdk || !orgAddr) return;
    try {
      const q = sdk.data.getTransactionHistory(orgAddr, PAGE_SIZE);
      const more = await q.queryNextPage();
      setRows(q.currentPage.results);
      setHistoryQuery(q);
      setHasMore(more);
    } catch {
      message.error('Failed to load transactions');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadBalance = async () => {
    if (!sdk || !orgAddr) return;
    setLoadingBalance(true);
    try {
      // V1 and V2 balances as TimeCircles strings
      const [v1, v2] = await Promise.all([
        sdk.data.getTotalBalance(orgAddr, true),
        sdk.data.getTotalBalanceV2(orgAddr, true),
      ]);
      // Sum up – both are strings that can be parsed as numbers
      const total = (parseFloat(v1) || 0) + (parseFloat(v2) || 0);
      setBalance(total.toFixed(2));
    } catch {
      message.error('Failed to load balance');
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const refreshAll = () => {
    setLoadingHistory(true);
    loadTransactions();
    loadBalance();
  };

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    refreshAll();
    refreshRef.current = setInterval(refreshAll, 20000);
    return () => clearInterval(refreshRef.current!);
  }, [sdk, orgAddr]);

  /* ---------- pagination ---------- */
  const loadMore = async () => {
    if (!historyQuery) return;
    setLoadingMore(true);
    try {
      const more = await historyQuery.queryNextPage();
      setRows((prev) => [...prev, ...historyQuery.currentPage.results]);
      setHasMore(more);
    } catch {
      message.error('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------- table columns ---------- */
  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      render: (ts: number) => new Date(ts * 1000).toLocaleString(),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      render: (v: number) => `v${v}`,
    },
    {
      title: 'From',
      dataIndex: 'from',
      render: (addr: string) => <Text copyable>{truncate(addr)}</Text>,
    },
    {
      title: 'To',
      dataIndex: 'to',
      render: (addr: string) => <Text copyable>{truncate(addr)}</Text>,
    },
    {
      title: 'Amount (CRC)',
      dataIndex: 'timeCircles',
      render: (val: number | string | null | undefined) => {
        if (val == null || Number.isNaN(Number(val))) return '–';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num.toFixed(2);
      },
    },
    {
      title: 'Txn Hash',
      dataIndex: 'transactionHash',
      render: (hash: string) => (
        <a
          href={`https://gnosisscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {truncate(hash)}
        </a>
      ),
    },
  ];

  /* ---------- render ---------- */
  if (!orgAddr) {
    return (
      <Card>
        <Text>You must create or connect an organisation first.</Text>
      </Card>
    );
  }

  return (
    <Layout.Content style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24} md={12}>
          <Card>
            <Statistic
              title="CRC Balance"
              value={loadingBalance ? undefined : balance}
              suffix={loadingBalance ? undefined : 'CRC'}
              prefix={loadingBalance ? <Spin /> : undefined}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Transaction History">
        {loadingHistory ? (
          <div style={{ textAlign: 'center' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : (
          <>
            <Table
              dataSource={rows}
              columns={columns}
              rowKey="transactionHash"
              pagination={false}
            />
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button loading={loadingMore} onClick={loadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </Layout.Content>
  );
}