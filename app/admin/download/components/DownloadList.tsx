'use client';

import { Table, Tag, Space, Button, Tooltip, Input, Select, message } from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined, FileTextOutlined, CopyOutlined } from '@ant-design/icons';
import type { DownloadRecord } from '../types';
import type { ColumnsType } from 'antd/es/table';

interface DownloadListProps {
  downloads: DownloadRecord[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onSearch?: (value: string) => void;
  onStatusFilter?: (status: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function DownloadList({
  downloads,
  loading,
  total = 0,
  page = 1,
  pageSize = 10,
  onRefresh,
  onPageChange,
  onSearch,
  onStatusFilter,
}: DownloadListProps) {
  const handleDownloadFile = (download: DownloadRecord) => {
    if (download.status === 'success') {
      window.open(`/api/download?url=${encodeURIComponent(download.url)}`, '_blank');
    }
  };

  const handleCopyUrl = async (url: string) => {
    if (!url) {
      message.error('No URL to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      message.success('URL copied to clipboard');
    } catch (_err) {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('URL copied to clipboard');
      } catch (_fallbackErr) {
        message.error('Failed to copy URL');
      }
      document.body.removeChild(textArea);
    }
  };

  const columns: ColumnsType<DownloadRecord> = [
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      width: 300,
      render: (url: string) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            aria-label="Copy URL"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyUrl(url);
            }}
          />
          <Tooltip title={url}>
            <span style={{ wordBreak: 'break-all' }}>{url}</span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (filename: string, record: DownloadRecord) => (
        <Space>
          <FileTextOutlined />
          <span>{filename}</span>
          {record.status === 'success' && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(record)}>
              Download
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => formatSize(size),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: DownloadRecord) => (
        <Tooltip title={record.error || ''}>
          <Tag color={status === 'success' ? 'green' : status === 'failed' ? 'red' : 'blue'}>{status}</Tag>
        </Tooltip>
      ),
      filters: [
        { text: 'Success', value: 'success' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Range Header',
      dataIndex: 'rangeHeader',
      key: 'rangeHeader',
      width: 150,
      ellipsis: true,
      render: (rangeHeader: string) => (
        <Tooltip title={rangeHeader}>
          <code
            style={{
              fontSize: '12px',
              background: '#f5f5f5',
              padding: '2px 4px',
              borderRadius: '3px',
            }}
          >
            {rangeHeader || '-'}
          </code>
        </Tooltip>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => (
        <Tooltip title={formatTime(createdAt)}>
          <span>{getTimeAgo(createdAt)}</span>
        </Tooltip>
      ),
      sorter: true,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search by URL or filename"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          onChange={(e) => onSearch?.(e.target.value)}
          onPressEnter={(e) => onSearch?.((e.target as HTMLInputElement).value)}
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => onStatusFilter?.(value || '')}
          options={[
            { label: 'Success', value: 'success' },
            { label: 'Failed', value: 'failed' },
          ]}
        />
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Refresh
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={downloads}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: onPageChange,
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}
