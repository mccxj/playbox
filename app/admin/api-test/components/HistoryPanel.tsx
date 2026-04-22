'use client';

import { useState, useEffect, useCallback } from 'react';
import { List, Typography, Tag, Empty, Spin, Input, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ApiTestHistoryRecord, ApiTestRequest, HistoryListResponse } from '../types';

const { Text } = Typography;

interface HistoryPanelProps {
  onSelect: (request: ApiTestRequest) => void;
}

const methodColors: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
  HEAD: 'cyan',
  OPTIONS: 'default',
};

export default function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [records, setRecords] = useState<ApiTestHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('pageSize', '50');

      const res = await fetch(`/api/admin/api-test/history?${params.toString()}`);
      const data: HistoryListResponse = await res.json();

      if (data.success && data.data) {
        setRecords(data.data.records);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSelect = (record: ApiTestHistoryRecord) => {
    let headers: { key: string; value: string }[] = [];
    if (record.headers) {
      try {
        const parsed = JSON.parse(record.headers);
        headers = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
      } catch {
        headers = [];
      }
    }

    onSelect({
      method: record.method as ApiTestRequest['method'],
      url: record.url,
      headers,
      body: record.body || '',
      bodyFormat: (record.bodyFormat as ApiTestRequest['bodyFormat']) || 'json',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/api-test/history?id=${id}`, { method: 'DELETE' });
      message.success('Deleted');
      fetchHistory();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/admin/api-test/history', { method: 'DELETE' });
      message.success('All history cleared');
      setRecords([]);
    } catch {
      message.error('Failed to clear history');
    }
  };

  const truncateUrl = (url: string, maxLen = 40) => {
    if (url.length <= maxLen) return url;
    return url.substring(0, maxLen) + '...';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={fetchHistory}
          allowClear
        />
      </div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={fetchHistory}>
          Refresh
        </Button>
        <Popconfirm title="Clear all history?" onConfirm={handleClearAll} okText="Yes" cancelText="No">
          <Button size="small" danger icon={<DeleteOutlined />}>
            Clear All
          </Button>
        </Popconfirm>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : records.length === 0 ? (
          <Empty description="No history" />
        ) : (
          <List
            dataSource={records}
            renderItem={(item) => (
              <List.Item style={{ cursor: 'pointer', padding: '8px 0' }} onClick={() => handleSelect(item)}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={methodColors[item.method] || 'default'}>{item.method}</Tag>
                    <Text ellipsis style={{ flex: 1 }} title={item.url}>
                      {truncateUrl(item.url)}
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    {item.responseStatus !== null && (
                      <Tag
                        style={{ marginLeft: 8 }}
                        color={item.responseStatus < 300 ? 'success' : item.responseStatus < 400 ? 'warning' : 'error'}
                      >
                        {item.responseStatus}
                      </Tag>
                    )}
                    {item.errorMessage && <Tag color="error">Error</Tag>}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
