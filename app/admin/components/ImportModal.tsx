'use client';

import { useState } from 'react';
import { Modal, Upload, Radio, Button, message, Typography, Space } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Text, Paragraph } = Typography;

interface ImportModalProps {
  open: boolean;
  table: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ open, table, onClose, onSuccess }: ImportModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPreviewData(content.slice(0, 1000) + (content.length > 1000 ? '...' : ''));
    };
    reader.readAsText(file);
    setFileList([file as unknown as UploadFile]);
    return false;
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const file = fileList[0] as unknown as File;
      const content = await file.text();

      const response = await fetch(`/api/admin/tables/${table}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: content,
          format,
        }),
      });

      const data = (await response.json()) as any;

      if (data.success) {
        message.success(data.message);
        setFileList([]);
        setPreviewData('');
        onSuccess();
      } else {
        message.error(data.error || 'Failed to import data');
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFileList([]);
    setPreviewData('');
    onClose();
  };

  return (
    <Modal
      title={`Import Data to ${table}`}
      open={open}
      onOk={handleImport}
      onCancel={handleClose}
      confirmLoading={loading}
      width={600}
      okText="Import"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Format:</Text>
          <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)} style={{ marginLeft: 16 }}>
            <Radio value="json">JSON</Radio>
            <Radio value="csv">CSV</Radio>
          </Radio.Group>
        </div>

        <Upload
          accept=".json,.csv,.txt"
          beforeUpload={handleUpload}
          fileList={fileList}
          maxCount={1}
          onRemove={() => {
            setFileList([]);
            setPreviewData('');
          }}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>

        {previewData && (
          <div>
            <Text strong>Preview:</Text>
            <Paragraph
              ellipsis={{ rows: 6, expandable: true }}
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                marginTop: 8,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              {previewData}
            </Paragraph>
          </div>
        )}

        <div style={{ background: '#fffbe6', padding: 12, borderRadius: 4 }}>
          <Text type="secondary">
            <FileTextOutlined style={{ marginRight: 8 }} />
            {format === 'json'
              ? 'JSON format: Array of objects with column names as keys'
              : 'CSV format: First row should be column headers'}
          </Text>
        </div>
      </Space>
    </Modal>
  );
}
