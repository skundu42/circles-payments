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
import { formatUnits } from 'ethers';
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
  const [exporting, setExporting] = useState(false);

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
      const [v1, v2] = await Promise.all([
        sdk.data.getTotalBalance(orgAddr, true),
        sdk.data.getTotalBalanceV2(orgAddr, true),
      ]);
      const rawTotal = (parseFloat(v1) || 0) + (parseFloat(v2) || 0);
      const full = rawTotal.toString();
      let truncatedBalance: string;
      if (full.includes('.')) {
        const [intPart, decPart] = full.split('.');
        const truncated = decPart.slice(0, 3);
        truncatedBalance = `${intPart}${truncated ? `.${truncated}` : ''}`;
      } else {
        truncatedBalance = full;
      }
      setBalance(truncatedBalance);
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

  useEffect(() => {
    refreshAll();
    refreshRef.current = setInterval(refreshAll, 20000);
    return () => clearInterval(refreshRef.current!);
  }, [sdk, orgAddr]);

  const loadMore = async () => {
    if (!historyQuery) return;
    setLoadingMore(true);
    try {
      const more = await historyQuery.queryNextPage();
      setRows(prev => [...prev, ...historyQuery.currentPage.results]);
      setHasMore(more);
    } catch {
      message.error('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------- CSV export ---------- */
  const exportCsv = async () => {
    if (!sdk || !orgAddr) {
      message.error('No organisation connected');
      return;
    }
    setExporting(true);
    try {
      const q = sdk.data.getTransactionHistory(orgAddr, PAGE_SIZE);
      let more = await q.queryNextPage();
      const all: any[] = [...q.currentPage.results];
      while (more) {
        more = await q.queryNextPage();
        all.push(...q.currentPage.results);
      }

      const header = ['Timestamp', 'Version', 'From', 'To', 'Amount (CRC)', 'Txn Hash'];
      const lines = all.map(r => {
        const ts = new Date(r.timestamp * 1000).toISOString();
        const version = `v${r.version}`;
        const from = r.from;
        const to = r.to;
        const full = formatUnits(r.value, 18);
        let amt = full;
        if (full.includes('.')) {
          const [i, d] = full.split('.');
          amt = `${i}${d.slice(0, 3) ? `.${d.slice(0, 3)}` : ''}`;
        }
        const hash = r.transactionHash;
        return [ts, version, from, to, amt, hash]
          .map(field => `"${field}"`)
          .join(',');
      });

      const csv = [header.join(','), ...lines].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      message.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

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
      dataIndex: 'value',
      render: (val: string) => {
        if (!val) return '–';
        const full = formatUnits(val, 18);
        if (full.includes('.')) {
          const [intPart, decPart] = full.split('.');
          const truncated = decPart.slice(0, 3);
          return `${intPart}${truncated ? `.${truncated}` : ''} CRC`;
        }
        return `${full} CRC`;
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

      <Card
        title="Transaction History"
        extra={
          <Button onClick={exportCsv} loading={exporting}>
            Export CSV
          </Button>
        }
      >
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