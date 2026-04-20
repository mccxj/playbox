'use client';

import { Tag, Space, Typography } from 'antd';
import { GiftOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ReferralBadge() {
  return (
    <a
      href="https://dash.domain.digitalplat.org/signup?ref=BA6ZfZnfat"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 14px',
        border: '1px solid #d6dbe7',
        borderRadius: 12,
        background: '#ffffff',
        color: '#0f172a',
        textDecoration: 'none',
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1890ff';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#d6dbe7';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.06)';
      }}
    >
      <Tag
        icon={<GiftOutlined />}
        color="blue"
        style={{
          margin: 0,
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: '0.02em',
          textTransform: 'uppercase' as React.CSSProperties['textTransform'],
        }}
      >
        DigitalPlat
      </Tag>
      <Space size={2} direction="vertical" style={{ lineHeight: 1.3 }}>
        <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
          This Website is Powered by DigitalPlat FreeDomain
        </Text>
        <Text style={{ fontSize: 12, color: '#475569' }}>Get a free domain from DigitalPlat.</Text>
      </Space>
    </a>
  );
}
