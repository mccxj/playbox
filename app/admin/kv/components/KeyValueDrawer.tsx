'use client';

import { useState, useEffect } from 'react';
import { Drawer, Descriptions, Input, Button, Spin, message, Space, Alert } from 'antd';
import { CopyOutlined, LoadingOutlined } from '@ant-design/icons';

interface KeyValueDrawerProps {
  open: boolean;
  namespace: string;
  keyName: string | null;
  onClose: () => void;
}

interface KeyValuePairResponse {
  success: boolean;
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function KeyValueDrawer({ open, namespace, keyName, onClose }: KeyValueDrawerProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [keyData, setKeyData] = useState<KeyValuePairResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (open && keyName && namespace) {
      fetchKeyValue();
    } else {
      // Reset state when drawer closes
      setLoadingState('idle');
      setKeyData(null);
      setErrorMessage('');
    }
  }, [open, keyName, namespace]);

  const fetchKeyValue = async () => {
    if (!keyName || !namespace) return;

    try {
      setLoadingState('loading');
      setErrorMessage('');

      const response = await fetch(`/api/admin/kv/${encodeURIComponent(namespace)}/${encodeURIComponent(keyName)}`);
      const data = await response.json();

      if (response.ok && typeof data === 'object' && data !== null && 'success' in data && data.success) {
        const keyData: KeyValuePairResponse = data as KeyValuePairResponse;
        setKeyData(keyData);
        setLoadingState('success');
      } else {
        setLoadingState('error');
        const errorMessage =
          typeof data === 'object' && data !== null
            ? (data as { message?: string; error?: string }).message ||
              (data as { message?: string; error?: string }).error ||
              'Failed to fetch key details'
            : 'Failed to fetch key details';
        setErrorMessage(errorMessage);
        message.error('Key not found or access denied');
      }
    } catch (error) {
      setLoadingState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Network error');
      message.error('Failed to load key details');
    }
  };

  const handleCopyValue = async () => {
    if (!keyData?.value) return;

    try {
      await navigator.clipboard.writeText(keyData.value);
      message.success('Value copied to clipboard');
    } catch (_error) {
      message.error('Failed to copy value');
    }
  };

  const getDescriptionsItems = () => {
    const items = [
      {
        key: 'key',
        label: 'Key Name',
        children: keyData?.key || '',
      },
      {
        key: 'value',
        label: 'Value',
        children: (
          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            <Input.TextArea
              value={keyData?.value || ''}
              readOnly
              autoSize={{ minRows: 4, maxRows: 10 }}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopyValue}
              disabled={!keyData?.value}
              size="small"
              style={{ alignSelf: 'flex-end' }}
            >
              Copy
            </Button>
          </Space>
        ),
      },
    ];

    if (keyData?.metadata) {
      items.push({
        key: 'metadata',
        label: 'Metadata',
        children: JSON.stringify(keyData.metadata, null, 2),
      });
    }

    return items;
  };

  const renderContent = () => {
    switch (loadingState) {
      case 'loading':
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin indicator={<LoadingOutlined spin />} />
            <p style={{ marginTop: 16 }}>Loading key details...</p>
          </div>
        );

      case 'error':
        return (
          <Alert
            message="Error"
            description={
              <div>
                <p>{errorMessage}</p>
                <p style={{ marginBottom: 0 }}>The key "{keyName}" may not exist or you don't have permission to access it.</p>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        );

      case 'success':
        return <Descriptions bordered column={1} size="small" items={getDescriptionsItems()} style={{ marginTop: 16 }} />;

      default:
        return null;
    }
  };

  return (
    <Drawer title="Key Details" placement="right" onClose={onClose} open={open} width={520} footer={null}>
      {keyName && namespace ? (
        renderContent()
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#999' }}>Select a key to view its details</p>
        </div>
      )}
    </Drawer>
  );
}
