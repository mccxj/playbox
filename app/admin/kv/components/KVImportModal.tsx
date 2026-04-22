'use client';

import { useState } from 'react';
import { Modal, Upload, Button, Input, message, Space, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface KVImportModalProps {
  open: boolean;
  namespace: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportItem {
  key: string;
  value: string;
  expirationTtl?: number;
}

export default function KVImportModal({ open, namespace, onClose, onSuccess }: KVImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
    setFileList([file as unknown as UploadFile]);
    return false;
  };

  const parseImportData = (): ImportItem[] | null => {
    if (!jsonText.trim()) {
      setError('Please enter or upload JSON data');
      return null;
    }

    try {
      const parsed = JSON.parse(jsonText);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          key: item.key,
          value: typeof item.value === 'string' ? item.value : JSON.stringify(item.value),
          expirationTtl: item.expirationTtl,
        }));
      } else if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        }));
      } else {
        setError('Invalid format. Expected array of objects or key-value object');
        return null;
      }
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      return null;
    }
  };

  const handleImport = async () => {
    setError(null);
    const items = parseImportData();
    if (!items || items.length === 0) return;

    const validItems = items.filter((item) => item.key && item.value !== undefined);
    if (validItems.length === 0) {
      setError('No valid items to import. Each item must have a key and value.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kv/${encodeURIComponent(namespace)}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });

      const data = (await response.json()) as any;

      if (data.success) {
        message.success(data.message);
        setJsonText('');
        setFileList([]);
        onSuccess();
      } else {
        setError(data.error || 'Failed to import');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJsonText('');
    setFileList([]);
    setError(null);
    onClose();
  };

  return (
    <Modal
      title="Import KV Keys"
      open={open}
      onOk={handleImport}
      onCancel={handleClose}
      confirmLoading={loading}
      width={700}
      okText="Import"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {error && <Alert message={error} type="error" closable onClose={() => setError(null)} />}

        <Upload
          accept=".json,.txt"
          beforeUpload={handleUpload}
          fileList={fileList}
          maxCount={1}
          onRemove={() => {
            setFileList([]);
            setJsonText('');
          }}
        >
          <Button icon={<UploadOutlined />}>Upload JSON File</Button>
        </Upload>

        <div>
          <strong>Paste or edit JSON:</strong>
          <Input.TextArea
            rows={10}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setFileList([]);
            }}
            placeholder={`Array format:
[
  { "key": "user:1", "value": "John", "expirationTtl": 3600 },
  { "key": "user:2", "value": "Jane" }
]

Or object format:
{
  "user:1": "John",
  "user:2": "Jane"
}`}
            style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}
          />
        </div>

        <Alert
          message="Format Options"
          description={
            <div>
              <div>
                • <strong>Array</strong>: Array of objects with key, value, and optional expirationTtl
              </div>
              <br />
              <div>
                • <strong>Object</strong>: Simple key-value object (keys as strings, values will be JSON-stringified if not strings)
              </div>
            </div>
          }
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
}
