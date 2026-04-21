'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Collapse, Table, Tag, Space, Button, Spin, Alert, Tooltip, Input } from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  SearchOutlined,
} from '@ant-design/icons';

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

interface SpeedTestState {
  status: 'idle' | 'testing' | 'success' | 'error';
  latency?: number;
  error?: string;
}

type SpeedTestResults = Record<string, SpeedTestState>;

type ModelSearchState = Record<string, string>;

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

function speedTestKey(provider: string, model: string) {
  return `${provider}::${model}`;
}

const DELAY_BETWEEN_TESTS_MS = 1000;

export default function ProvidersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speedTestResults, setSpeedTestResults] = useState<SpeedTestResults>({});
  const [batchTestingProvider, setBatchTestingProvider] = useState<string | null>(null);
  const [modelSearchTerms, setModelSearchTerms] = useState<ModelSearchState>({});
  const abortRef = useRef(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/providers/models');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = (await response.json()) as ProvidersResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const runSpeedTest = useCallback(async (provider: string, model: string) => {
    const key = speedTestKey(provider, model);
    setSpeedTestResults((prev) => ({ ...prev, [key]: { status: 'testing' } }));

    try {
      const response = await fetch('/api/admin/providers/speed-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model }),
      });
      const json = (await response.json()) as {
        success: boolean;
        result?: { latency: number; error?: string };
        error?: string;
      };

      if (json.success && json.result) {
        setSpeedTestResults((prev) => ({
          ...prev,
          [key]: {
            status: json.result!.error ? 'error' : 'success',
            latency: json.result!.latency,
            error: json.result!.error,
          },
        }));
      } else {
        setSpeedTestResults((prev) => ({
          ...prev,
          [key]: { status: 'error', error: json.error || 'Unknown error' },
        }));
      }
    } catch (err) {
      setSpeedTestResults((prev) => ({
        ...prev,
        [key]: { status: 'error', error: (err as Error).message },
      }));
    }
  }, []);

  const runBatchSpeedTest = useCallback(
    async (providerName: string, models: string[]) => {
      setBatchTestingProvider(providerName);
      abortRef.current = false;

      for (const model of models) {
        if (abortRef.current) break;
        await runSpeedTest(providerName, model);
        if (model !== models[models.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_TESTS_MS));
        }
      }

      setBatchTestingProvider(null);
    },
    [runSpeedTest]
  );

  const stopBatchTest = useCallback(() => {
    abortRef.current = true;
    setBatchTestingProvider(null);
  }, []);

  const filterModels = (models: ModelInfo[], searchTerm: string) => {
    if (!searchTerm.trim()) return models;
    const term = searchTerm.toLowerCase();
    return models.filter((m) => m.id.toLowerCase().includes(term));
  };

  const handleModelSearch = (providerKey: string, value: string) => {
    setModelSearchTerms((prev) => ({ ...prev, [providerKey]: value }));
  };

  const getProviderKey = (provider: string, family: string) => `${family}:${provider}`;

  const renderSpeedTestResult = (provider: string, model: string) => {
    const key = speedTestKey(provider, model);
    const result = speedTestResults[key];

    if (!result || result.status === 'idle') {
      return (
        <Button size="small" icon={<ThunderboltOutlined />} onClick={() => runSpeedTest(provider, model)}>
          测速
        </Button>
      );
    }

    if (result.status === 'testing') {
      return <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />;
    }

    if (result.status === 'success') {
      return <Tag color="green">{result.latency}ms</Tag>;
    }

    return (
      <Tooltip title={result.error}>
        <Tag color="red" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {result.error || 'Error'}
        </Tag>
      </Tooltip>
    );
  };

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
            <Tag onClick={fetchProviders} style={{ cursor: 'pointer' }}>
              Retry
            </Tag>
          </Space>
        }
      />
    );
  }

  if (!data) return null;

  const columns = (family: string) => [
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
      render: (models: string[]) => <Tag color={models?.length > 0 ? 'green' : 'default'}>{models?.length || 0} models</Tag>,
    },
    {
      title: 'API Status',
      dataIndex: 'error',
      key: 'status',
      render: (error?: string) =>
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
        ),
    },
    {
      title: 'Fetched Models',
      dataIndex: 'fetched',
      key: 'fetched',
      render: (fetched?: ModelInfo[]) => <Tag color={fetched?.length ? 'cyan' : 'default'}>{fetched?.length || 0} models</Tag>,
    },
    {
      title: '测速',
      key: 'speed-test',
      width: 120,
      render: (_: unknown, record: ProviderModels) => {
        const isBatching = batchTestingProvider === record.provider;
        return (
          <Button
            size="small"
            type={isBatching ? 'primary' : 'default'}
            danger={isBatching}
            icon={<ThunderboltOutlined />}
            onClick={() => (isBatching ? stopBatchTest() : runBatchSpeedTest(record.provider, record.models || []))}
          >
            {isBatching ? '停止' : '全部测速'}
          </Button>
        );
      },
    },
  ];

  const modelColumns = (providerName: string, configuredModels: string[]) => [
    {
      title: 'Model ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <Space>
          <code style={{ fontSize: '12px' }}>{text}</code>
          {configuredModels.includes(text) && (
            <Tag color="green" style={{ marginLeft: 4 }}>
              Configured
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owned_by',
      key: 'owned_by',
      render: (text?: string) => (text ? <Tag>{text}</Tag> : '-'),
    },
    {
      title: '测速',
      key: 'speed-test',
      width: 140,
      render: (_: unknown, record: ModelInfo) => renderSpeedTestResult(providerName, record.id),
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
        columns={columns(family)}
        rowKey="provider"
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender: (record) => {
            const configuredModels = record.models || [];
            const fetchedModels = record.fetched || [];
            const fetchedIds = fetchedModels.map((m) => m.id);
            const missingModels = configuredModels.filter((m) => !fetchedIds.includes(m));
            const providerKey = getProviderKey(record.provider, record.provider);
            const searchTerm = modelSearchTerms[providerKey] || '';
            const filteredFetchedModels = filterModels(fetchedModels, searchTerm);
            const filteredConfiguredModels = configuredModels.filter((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));
            const displayModels =
              fetchedModels.length > 0 ? filteredFetchedModels : filteredConfiguredModels.map((m: string) => ({ id: m, object: 'model' }));

            return (
              <div style={{ margin: '8px 0' }}>
                <div style={{ marginBottom: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Models:</span>
                  <Input
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="Search model ID..."
                    value={searchTerm}
                    onChange={(e) => handleModelSearch(providerKey, e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                    size="small"
                  />
                  {searchTerm && (
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      ({displayModels.length} of {fetchedModels.length > 0 ? fetchedModels.length : configuredModels.length})
                    </span>
                  )}
                </div>
                {missingModels.length > 0 && (
                  <div
                    style={{ marginBottom: '8px', padding: '8px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px' }}
                  >
                    <span style={{ color: '#d46b08' }}>⚠️ Configured models not in API response: </span>
                    {missingModels.map((m) => (
                      <Tag key={m} color="orange">
                        {m}
                      </Tag>
                    ))}
                  </div>
                )}
                <Table
                  dataSource={displayModels}
                  columns={modelColumns(record.provider, configuredModels)}
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
        <Tag onClick={fetchProviders} style={{ cursor: 'pointer' }}>
          Refresh
        </Tag>
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
