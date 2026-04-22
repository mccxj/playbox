'use client';

import { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

interface DownloadFormProps {
  onDownload?: () => void;
}

export function DownloadForm({ onDownload }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    if (!url.trim()) {
      message.error('Please enter a URL');
      return;
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        message.error('Only HTTP/HTTPS URLs are allowed');
        return;
      }
    } catch {
      message.error('Invalid URL format');
      return;
    }

    setLoading(true);

    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
    window.open(downloadUrl, '_blank');
    message.success('Download initiated');
    onDownload?.();

    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <Card title="Quick Download" style={{ marginBottom: 24 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Enter URL to download (e.g., https://example.com/file.pdf)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleDownload}
          allowClear
          size="large"
        />
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} loading={loading} size="large">
          Download
        </Button>
      </Space.Compact>
    </Card>
  );
}
