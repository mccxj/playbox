'use client';

import { useState } from 'react';
import { ConfigProvider, App as AntApp, Layout, Menu, Typography, Button } from 'antd';
import {
  DatabaseOutlined,
  CloudOutlined,
  DownloadOutlined,
  MessageOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ApiOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  MailOutlined,
  GlobalOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VConsole from '../components/VConsole';
import ReferralBadge from './components/ReferralBadge';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: 'tables',
    icon: <DatabaseOutlined />,
    label: <Link href="/admin">Tables (D1)</Link>,
  },
  {
    key: 'llm-keys',
    icon: <ApiOutlined />,
    label: <Link href="/admin/llm-keys">API Keys</Link>,
  },
  {
    key: 'kv',
    icon: <CloudOutlined />,
    label: <Link href="/admin/kv">KV Storage</Link>,
  },
  {
    key: 'r2',
    icon: <CloudServerOutlined />,
    label: <Link href="/admin/r2">R2 Storage</Link>,
  },
  {
    key: 'providers',
    icon: <AppstoreOutlined />,
    label: <Link href="/admin/providers">Providers</Link>,
  },
  {
    key: 'download',
    icon: <DownloadOutlined />,
    label: <Link href="/admin/download">Download</Link>,
  },
  {
    key: 'chat',
    icon: <MessageOutlined />,
    label: <Link href="/admin/chat">Chat Test</Link>,
  },
  {
    key: 'api-test',
    icon: <ApiOutlined />,
    label: <Link href="/admin/api-test">API Test</Link>,
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: <Link href="/admin/analytics">Analytics</Link>,
  },
  {
    key: 'email',
    icon: <MailOutlined />,
    label: <Link href="/admin/email">Email Test</Link>,
  },
  {
    key: 'domains',
    icon: <GlobalOutlined />,
    label: <Link href="/admin/domains">Domains</Link>,
  },
  {
    key: 'short-url',
    icon: <LinkOutlined />,
    label: <Link href="/admin/short-url">Short URL</Link>,
  },
];

const PATH_KEY_MAP: Record<string, string> = {
  'llm-keys': 'llm-keys',
  'kv': 'kv',
  'r2': 'r2',
  'providers': 'providers',
  'download': 'download',
  'chat': 'chat',
  'api-test': 'api-test',
  'analytics': 'analytics',
  'email': 'email',
  'domains': 'domains',
  'short-url': 'short-url',
};

const PAGE_TITLE_MAP: Record<string, string> = {
  'tables': 'Database Management',
  'llm-keys': 'API Key Management',
  'kv': 'KV Storage Management',
  'r2': 'R2 Storage Management',
  'providers': 'Provider Models',
  'download': 'File Download Proxy',
  'chat': 'Chat Test',
  'api-test': 'API Test',
  'analytics': 'API Analytics',
  'email': 'Email Test',
  'domains': 'Domain Query',
  'short-url': 'Short URL',
};

const SIDER_STYLE = {
  transition: 'all 0.2s',
} as const;

const BRAND_STYLE = {
  padding: '16px',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative',
} as const;

const TITLE_STYLE = {
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
} as const;

const HEADER_STYLE = {
  background: '#fff',
  padding: '0 24px',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
} as const;

const CONTENT_STYLE = {
  margin: '24px',
  padding: '24px',
  background: '#fff',
  borderRadius: '8px',
  minHeight: '280px',
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const getSelectedKey = () => {
    for (const [path, key] of Object.entries(PATH_KEY_MAP)) {
      if (pathname?.includes(`/admin/${path}`)) {
        return key;
      }
    }
    return 'tables';
  };

  const getPageTitle = () => {
    const key = getSelectedKey();
    return PAGE_TITLE_MAP[key] || 'Database Management';
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <VConsole />
      <AntApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider width={220} theme="light" collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null} style={SIDER_STYLE}>
            <div style={{ ...BRAND_STYLE, justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <Title level={4} style={TITLE_STYLE}>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                {!collapsed && 'Admin'}
              </Title>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  position: collapsed ? 'absolute' : 'relative',
                  right: collapsed ? 8 : 'auto',
                  top: collapsed ? '50%' : 'auto',
                  transform: collapsed ? 'translateY(-50%)' : 'none',
                }}
              />
            </div>
            <Menu mode="inline" selectedKeys={[getSelectedKey()]} items={menuItems} inlineCollapsed={collapsed} />
          </Sider>
          <Layout>
            <Header style={HEADER_STYLE}>
              <Title level={4} style={{ margin: 0 }}>
                {getPageTitle()}
              </Title>
              <ReferralBadge />
            </Header>
            <Content style={CONTENT_STYLE}>{children}</Content>
          </Layout>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
