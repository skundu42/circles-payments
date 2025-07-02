'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Typography,
  message,
  Row,
  Col,
  Statistic,
  Space,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext';

const { Text } = Typography;
const { Content } = Layout;

const PAGE_SIZE = 20;
const POLL_INTERVAL = 10_000;

function truncate(str: string) {
  return `${str.slice(0, 6)}…${str.slice(-4)}`;
}

interface TxRow {
  timestamp: number;
  version: number;
  from: string;
  to: string;
  value: string;
  transactionHash: string;
  fromName: string;
  toName: string;
}

export default function TransactionsPage() {
  const { sdk, orgAddr } = useWallet();

  const [historyQuery, setHistoryQuery] = useState<any>(null);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const nameCacheRef = useRef<Record<string, string>>({});
  const latestTxHashRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timer>();

  const resolveName = async (addr: string): Promise<string> => {
    const cache = nameCacheRef.current;
    if (cache[addr]) return cache[addr];

    let name: string | null = null;
    try {
      const avatar = await sdk.getAvatar(addr);
      const profile = await avatar.getProfile();
      if (profile?.name) name = profile.name;
    } catch {}

    if (name) cache[addr] = name;
    return name ?? truncate(addr);
  };

  const withNames = async (results: any[]): Promise<TxRow[]> => {
    return Promise.all(
      results.map(async (r) => {
        const [fromName, toName] = await Promise.all([
          resolveName(r.from),
          resolveName(r.to),
        ]);
        return { ...r, fromName, toName };
      }),
    );
  };

  const loadTransactions = async () => {
    if (!sdk || !orgAddr) return;

    try {
      const q = sdk.data.getTransactionHistory(orgAddr, PAGE_SIZE);
      const more = await q.queryNextPage();
      const mapped = await withNames(q.currentPage.results);

      setRows(mapped);
      setHistoryQuery(q);
      setHasMore(more);
      latestTxHashRef.current = mapped[0]?.transactionHash ?? null;
    } catch {
      message.error('Failed to load transactions');
    }
  };

  const loadMore = async () => {
    if (!historyQuery) return;

    try {
      const more = await historyQuery.queryNextPage();
      const mapped = await withNames(historyQuery.currentPage.results);

      setRows((prev) => [...prev, ...mapped]);
      setHasMore(more);
    } catch {
      message.error('Failed to load more');
    }
  };

  const loadBalance = async () => {
    if (!sdk || !orgAddr) return;

    try {
      const [v1, v2] = await Promise.all([
        sdk.data.getTotalBalance(orgAddr, true),
        sdk.data.getTotalBalanceV2(orgAddr, true),
      ]);

      const rawTotal = (parseFloat(v1) || 0) + (parseFloat(v2) || 0);
      let full = rawTotal.toString();

      if (full.includes('.')) {
        const [intPart, decPart] = full.split('.');
        const truncated = decPart.slice(0, 3);
        full = `${intPart}${truncated ? `.${truncated}` : ''}`;
      }

      setBalance(full);
    } catch {
      message.error('Failed to load balance');
      setBalance(null);
    }
  };

  const refreshAll = () => {
    loadTransactions();
    loadBalance();
  };

  const pollForUpdates = async () => {
    if (!sdk || !orgAddr) return;

    try {
      const q = sdk.data.getTransactionHistory(orgAddr, 1);
      await q.queryNextPage();

      const latest = q.currentPage.results[0];
      if (latest && latest.transactionHash !== latestTxHashRef.current) {
        refreshAll();
      }
    } catch {}
  };

  useEffect(() => {
    if (sdk && orgAddr) {
      refreshAll();
      pollRef.current = setInterval(pollForUpdates, POLL_INTERVAL);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sdk, orgAddr]);

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

      const header = [
        'Timestamp',
        'Version',
        'From Address',
        'To Address',
        'Amount (CRC)',
        'Txn Hash',
      ];

      const lines = all.map((r) => {
        const ts = new Date(r.timestamp * 1000).toISOString();
        const version = `v${r.version}`;
        let amt = formatUnits(r.value, 18);

        if (amt.includes('.')) {
          const [i, d] = amt.split('.');
          amt = `${i}${d.slice(0, 3) ? `.${d.slice(0, 3)}` : ''}`;
        }

        return [
          `"${ts}"`,
          `"${version}"`,
          `"${r.from}"`,
          `"${r.to}"`,
          `"${amt}"`,
          `"${r.transactionHash}"`,
        ].join(',');
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
      dataIndex: 'fromName',
      render: (_: string, row: TxRow) => (
        <Text copyable={{ text: row.from }}>{row.fromName}</Text>
      ),
    },
    {
      title: 'To',
      dataIndex: 'toName',
      render: (_: string, row: TxRow) => (
        <Text copyable={{ text: row.to }}>{row.toName}</Text>
      ),
    },
    {
      title: 'Amount (CRC)',
      dataIndex: 'value',
      render: (val: string) => {
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
    <Content style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24} md={12}>
          <Card>
            <Statistic title="CRC Balance" value={balance ?? '–'} suffix="CRC" />
          </Card>
        </Col>
      </Row>

      <Card
        title="Transaction History"
        extra={
          <Space>
            <Button onClick={exportCsv} loading={exporting}>
              Export CSV
            </Button>
            <Button onClick={refreshAll} icon={<ReloadOutlined />}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="transactionHash"
          pagination={false}
        />
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={loadMore}>Load more</Button>
          </div>
        )}
      </Card>
    </Content>
  );
}