'use client';

import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ModelSelector from './ModelSelector';
import type { Model } from '../../lib/chat-api';

interface Props {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  loadingModels: boolean;
  onApiKeyClick: () => void;
}

export default function FunctionBar({ models, selectedModel, onModelChange, loadingModels, onApiKeyClick }: Props) {
  return (
    <div
      style={{
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ModelSelector models={models} value={selectedModel} onChange={onModelChange} loading={loadingModels} />
      </div>
      <Button icon={<SettingOutlined />} onClick={onApiKeyClick} size="small">
        API Key
      </Button>
    </div>
  );
}
