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
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'tables',
      icon: <DatabaseOutlined />,
      label: <Link href="/admin">Tables (D1)</Link>,
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
  ];

  const getSelectedKey = () => {
    if (pathname?.includes('/admin/kv')) return 'kv';
    if (pathname?.includes('/admin/r2')) return 'r2';
    if (pathname?.includes('/admin/providers')) return 'providers';
    if (pathname?.includes('/admin/download')) return 'download';
    if (pathname?.includes('/admin/chat')) return 'chat';
    if (pathname?.includes('/admin/api-test')) return 'api-test';
    if (pathname?.includes('/admin/analytics')) return 'analytics';
    if (pathname?.includes('/admin/email')) return 'email';
    return 'tables';
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            width={220}
            theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            style={{
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
            >
              <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
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
            <Header
              style={{
                background: '#fff',
                padding: '0 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                {pathname?.includes('/admin/kv')
                  ? 'KV Storage Management'
                  : pathname?.includes('/admin/r2')
                    ? 'R2 Storage Management'
                    : pathname?.includes('/admin/providers')
                      ? 'Provider Models'
                      : pathname?.includes('/admin/download')
                        ? 'File Download Proxy'
                        : pathname?.includes('/admin/chat')
                          ? 'Chat Test'
                          : pathname?.includes('/admin/api-test')
                            ? 'API Test'
                            : pathname?.includes('/admin/analytics')
                              ? 'API Analytics'
                              : pathname?.includes('/admin/email')
                                ? 'Email Test'
                                : 'Database Management'}
              </Title>
            </Header>
            <Content
              style={{
                margin: '24px',
                padding: '24px',
                background: '#fff',
                borderRadius: '8px',
                minHeight: '280px',
              }}
            >
              {children}
            </Content>
          </Layout>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
