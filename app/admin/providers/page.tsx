'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Collapse, Table, Tag, Space, message, Spin, Alert } from 'antd';
import { ApiOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

interface ProviderModels {
  provider: string;
  family: string;
  endpoint: string;
  models: string[];
  fetched?: ModelInfo[];
  error?: string;
}

interface ProvidersResponse {
  success: boolean;
  providers: {
    openai: ProviderModels[];
    anthropic: ProviderModels[];
    gemini: ProviderModels[];
  };
}

const familyColors: Record<string, string> = {
  openai: '#10a37f',
  anthropic: '#d97706',
  gemini: '#4285f4',
};

const familyLabels: Record<string, string> = {
  openai: 'OpenAI Compatible',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
};

export default function ProvidersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/providers/models');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json() as ProvidersResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
      message.error('Failed to fetch provider models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading provider models..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Space>
            <Tag onClick={fetchProviders} style={{ cursor: 'pointer' }}>Retry</Tag>
          </Space>
        }
      />
    );
  }

  if (!data) return null;

  const columns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true,
    },
    {
      title: 'Configured',
      dataIndex: 'models',
      key: 'configured',
      render: (models: string[]) => (
        <Tag color={models?.length > 0 ? 'green' : 'default'}>
          {models?.length || 0} models
        </Tag>
      ),
    },
    {
      title: 'API Status',
      dataIndex: 'error',
      key: 'status',
      render: (error?: string) => (
        error ? (
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ color: '#ff4d4f' }}>{error}</span>
          </Space>
        ) : (
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: '#52c41a' }}>Connected</span>
          </Space>
        )
      ),
    },
    {
      title: 'Fetched Models',
      dataIndex: 'fetched',
      key: 'fetched',
      render: (fetched?: ModelInfo[]) => (
        <Tag color={fetched?.length ? 'cyan' : 'default'}>
          {fetched?.length || 0} models
        </Tag>
      ),
    },
  ];

  const modelColumns = (configuredModels: string[]) => [
    {
      title: 'Model ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <Space>
          <code style={{ fontSize: '12px' }}>{text}</code>
          {configuredModels.includes(text) && (
            <Tag color="green" style={{ marginLeft: 4 }}>Configured</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owned_by',
      key: 'owned_by',
      render: (text?: string) => text ? <Tag>{text}</Tag> : '-',
    },
  ];

  const renderFamilyPanel = (family: string, providers: ProviderModels[]) => (
    <Panel
      header={
        <Space>
          <ApiOutlined style={{ color: familyColors[family] }} />
          <span style={{ fontWeight: 500 }}>{familyLabels[family]}</span>
          <Tag color={familyColors[family]}>{providers.length} providers</Tag>
        </Space>
      }
      key={family}
    >
      <Table
        dataSource={providers}
        columns={columns}
        rowKey="provider"
        pagination={false}
        size="small"
expandable={{
      expandedRowRender: (record) => {
        const configuredModels = record.models || [];
        const fetchedModels = record.fetched || [];
        const fetchedIds = fetchedModels.map(m => m.id);
        const missingModels = configuredModels.filter(m => !fetchedIds.includes(m));
        
        return (
          <div style={{ margin: '8px 0' }}>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>Models:</div>
            {missingModels.length > 0 && (
              <div style={{ marginBottom: '8px', padding: '8px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px' }}>
                <span style={{ color: '#d46b08' }}>⚠️ Configured models not in API response: </span>
                {missingModels.map(m => <Tag key={m} color="orange">{m}</Tag>)}
              </div>
            )}
            <Table
              dataSource={fetchedModels.length > 0 ? fetchedModels : configuredModels.map((m: string) => ({ id: m, object: 'model' }))}
              columns={modelColumns(configuredModels)}
              rowKey="id"
              pagination={false}
              size="small"
              showHeader={false}
            />
          </div>
        );
      },
      rowExpandable: (record) => (record.fetched?.length || record.models?.length || 0) > 0,
    }}
      />
    </Panel>
  );

  return (
    <div>
      <Space style={{ marginBottom: '16px' }}>
        <Tag onClick={fetchProviders} style={{ cursor: 'pointer' }}>Refresh</Tag>
      </Space>
      <Card>
        <Collapse defaultActiveKey={['openai', 'anthropic', 'gemini']}>
          {renderFamilyPanel('openai', data.providers.openai)}
          {renderFamilyPanel('anthropic', data.providers.anthropic)}
          {renderFamilyPanel('gemini', data.providers.gemini)}
        </Collapse>
      </Card>
    </div>
  );
}
