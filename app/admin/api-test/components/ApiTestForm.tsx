'use client';

import { Select, Input, Button, Space, Tabs, Row, Col } from 'antd';
import { PlusOutlined, MinusOutlined, SendOutlined } from '@ant-design/icons';
import type { ApiTestRequest, HttpMethod, BodyFormat } from '../types';

const { TextArea } = Input;
const { TabPane } = Tabs;

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const BODY_FORMATS: { value: BodyFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form' },
  { value: 'raw', label: 'Raw' },
];

interface ApiTestFormProps {
  request: ApiTestRequest;
  onChange: (request: ApiTestRequest) => void;
  onExecute: () => void;
  loading: boolean;
}

export default function ApiTestForm({ request, onChange, onExecute, loading }: ApiTestFormProps) {
  const updateField = <K extends keyof ApiTestRequest>(key: K, value: ApiTestRequest[K]) => {
    onChange({ ...request, [key]: value });
  };

  const addHeader = () => {
    updateField('headers', [...request.headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = request.headers.filter((_, i) => i !== index);
    updateField('headers', newHeaders);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    updateField('headers', newHeaders);
  };

  const handleExecute = () => {
    if (!request.url.trim()) {
      return;
    }
    onExecute();
  };

  const showBodyTab = !['GET', 'HEAD'].includes(request.method);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={8}>
        <Col flex="120px">
          <Select
            value={request.method}
            onChange={(v) => updateField('method', v)}
            options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
            style={{ width: '100%' }}
          />
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Enter URL (e.g., https://api.example.com/endpoint)"
            value={request.url}
            onChange={(e) => updateField('url', e.target.value)}
            onPressEnter={handleExecute}
          />
        </Col>
        <Col>
          <Button type="primary" icon={<SendOutlined />} onClick={handleExecute} loading={loading} disabled={!request.url.trim()}>
            Execute
          </Button>
        </Col>
      </Row>

      <Tabs defaultActiveKey="headers">
        <TabPane tab="Headers" key="headers">
          <Space direction="vertical" style={{ width: '100%' }}>
            {request.headers.map((header, index) => (
              <Row key={index} gutter={8}>
                <Col flex="auto">
                  <Input placeholder="Header name" value={header.key} onChange={(e) => updateHeader(index, 'key', e.target.value)} />
                </Col>
                <Col flex="auto">
                  <Input placeholder="Header value" value={header.value} onChange={(e) => updateHeader(index, 'value', e.target.value)} />
                </Col>
                <Col>
                  <Button icon={<MinusOutlined />} onClick={() => removeHeader(index)} disabled={request.headers.length === 1} />
                </Col>
              </Row>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addHeader}>
              Add Header
            </Button>
          </Space>
        </TabPane>

        {showBodyTab && (
          <TabPane tab="Body" key="body">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                value={request.bodyFormat}
                onChange={(v) => updateField('bodyFormat', v)}
                options={BODY_FORMATS}
                style={{ width: 120 }}
              />
              <TextArea
                placeholder={request.bodyFormat === 'json' ? '{"key": "value"}' : 'Request body'}
                value={request.body}
                onChange={(e) => updateField('body', e.target.value)}
                rows={10}
                style={{ fontFamily: 'monospace' }}
              />
            </Space>
          </TabPane>
        )}
      </Tabs>
    </Space>
  );
}
