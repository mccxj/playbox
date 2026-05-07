'use client';

import dynamic from 'next/dynamic';
import { Tabs } from 'antd';
import { SettingOutlined, AppstoreOutlined } from '@ant-design/icons';

const ProviderConfigTab = dynamic(() => import('./components/ProviderConfigTab'), { ssr: false });
const ProviderModelsTab = dynamic(() => import('./components/ProviderModelsTab'), { ssr: false });

export default function ProvidersPage() {
  const items = [
    {
      key: 'config',
      label: (
        <span>
          <SettingOutlined /> 配置
        </span>
      ),
      children: <ProviderConfigTab />,
    },
    {
      key: 'models',
      label: (
        <span>
          <AppstoreOutlined /> 模型
        </span>
      ),
      children: <ProviderModelsTab />,
    },
  ];

  return <Tabs defaultActiveKey="config" items={items} />;
}
