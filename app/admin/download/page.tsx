'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { DownloadList } from './components/DownloadList';
import { DownloadForm } from './components/DownloadForm';
import { useDownloads } from './hooks/useDownloads';

const { Title } = Typography;

export default function DownloadPage() {
  const { downloads, loading, error, page, pageSize, total, fetchDownloads, setParams } = useDownloads();

  const handlePageChange = (newPage: number) => {
    fetchDownloads({ page: newPage });
  };

  const handleRefresh = () => {
    fetchDownloads();
  };

  const handleSearch = (value: string) => {
    setParams({ search: value });
    fetchDownloads({ page: 1, search: value });
  };

  const handleStatusFilter = (status: string) => {
    setParams({ status });
    fetchDownloads({ page: 1, status });
  };

  const handleFormDownload = () => {
    fetchDownloads();
  };

  return (
    <div>
      {error && <Alert message="Error" description={error} type="error" closable onClose={() => {}} style={{ marginBottom: 24 }} />}

      <DownloadForm onDownload={handleFormDownload} />

      <DownloadList
        downloads={downloads}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onRefresh={handleRefresh}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
      />
    </div>
  );
}
