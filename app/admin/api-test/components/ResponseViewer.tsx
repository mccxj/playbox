'use client';

import { Card, Tabs, Table, Tag, Typography, Empty, Space, Input } from 'antd';
import type { ApiTestResponse } from '../types';

const { TextArea } = Input;
const { Text } = Typography;

interface ResponseViewerProps {
  response: ApiTestResponse | null;
}

function formatJson(str: string): string {
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

function getStatusColor(status: number): string {
  if (status < 200) return 'default';
  if (status < 300) return 'success';
  if (status < 400) return 'warning';
  return 'error';
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
  if (!response) {
    return <Empty description="No response yet" />;
  }

  const headerRows = Object.entries(response.headers).map(([key, value], index) => ({
    key,
    name: key,
    value,
    index,
  }));

  const displayBody = formatJson(response.body);

  return (
    <Card size="small">
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Text strong>Status:</Text>
          <Tag color={getStatusColor(response.status)}>
            {response.status} {response.statusText}
          </Tag>
          <Text type="secondary">{response.duration}ms</Text>
        </Space>
      </div>

      <Tabs defaultActiveKey="body">
        <Tabs.TabPane tab="Body" key="body">
          <TextArea value={displayBody} rows={15} readOnly style={{ fontFamily: 'monospace', fontSize: 13 }} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Headers" key="headers">
          <Table
            dataSource={headerRows}
            columns={[
              { title: 'Name', dataIndex: 'name', key: 'name', width: '40%' },
              { title: 'Value', dataIndex: 'value', key: 'value' },
            ]}
            pagination={false}
            size="small"
            rowKey="key"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
}
