'use client';

import { useState } from 'react';
import { ConfigProvider, App as AntApp, Layout, Menu, Typography, Button, Drawer } from 'antd';
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
  ExperimentOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VConsole from '../components/VConsole';
import ReferralBadge from './components/ReferralBadge';
import { useIsMobile } from '../lib/responsive';

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
    key: 'langextract',
    icon: <ExperimentOutlined />,
    label: <Link href="/admin/langextract">LangExtract</Link>,
  },
  {
    key: 'short-url',
    icon: <LinkOutlined />,
    label: <Link href="/admin/short-url">Short URL</Link>,
  },
  {
    key: 'github-gists',
    icon: <GithubOutlined />,
    label: <Link href="/admin/github-gists">GitHub Gists</Link>,
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
  'langextract': 'langextract',
  'short-url': 'short-url',
  'github-gists': 'github-gists',
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
  'langextract': 'LangExtract',
  'short-url': 'Short URL',
  'github-gists': 'GitHub Gists',
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

function getSelectedKey(pathname: string | null): string {
  for (const [path, key] of Object.entries(PATH_KEY_MAP)) {
    if (pathname?.includes(`/admin/${path}`)) {
      return key;
    }
  }
  return 'tables';
}

function getPageTitle(selectedKey: string): string {
  return PAGE_TITLE_MAP[selectedKey] || 'Database Management';
}

function SidebarContent({
  collapsed,
  setCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <>
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
      <Menu mode="inline" selectedKeys={[getSelectedKey(pathname)]} items={menuItems} inlineCollapsed={collapsed} onClick={handleClick} />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = getSelectedKey(usePathname());
  const pageTitle = getPageTitle(selectedKey);

  const handleDrawerClose = () => setDrawerOpen(false);
  const handleDrawerOpen = () => setDrawerOpen(true);

  const headerStyle: React.CSSProperties = {
    background: '#fff',
    padding: isMobile ? '0 12px' : '0 24px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
  };

  const contentStyle: React.CSSProperties = {
    margin: isMobile ? '8px' : '24px',
    padding: isMobile ? '12px' : '24px',
    background: '#fff',
    borderRadius: '8px',
    minHeight: '280px',
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
          {isMobile ? (
            <>
              <Header style={headerStyle}>
                <Button type="text" icon={<MenuUnfoldOutlined />} onClick={handleDrawerOpen} style={{ marginRight: 8 }} />
                <Title level={4} style={{ margin: 0, fontSize: 16 }}>
                  {pageTitle}
                </Title>
              </Header>
              <Drawer
                title={
                  <Title level={4} style={{ margin: 0 }}>
                    <DatabaseOutlined style={{ marginRight: 8 }} />
                    Admin
                  </Title>
                }
                placement="left"
                onClose={handleDrawerClose}
                open={drawerOpen}
                bodyStyle={{ padding: 0 }}
                width="75%"
              >
                <SidebarContent collapsed={false} setCollapsed={() => {}} onNavigate={handleDrawerClose} />
              </Drawer>
              <Content style={contentStyle}>{children}</Content>
            </>
          ) : (
            <>
              <Sider
                width={220}
                theme="light"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                style={SIDER_STYLE}
              >
                <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
              </Sider>
              <Layout>
                <Header style={headerStyle}>
                  <Title level={4} style={{ margin: 0 }}>
                    {pageTitle}
                  </Title>
                  <ReferralBadge />
                </Header>
                <Content style={contentStyle}>{children}</Content>
              </Layout>
            </>
          )}
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
