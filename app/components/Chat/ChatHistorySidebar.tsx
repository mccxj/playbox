'use client';

import { useState } from 'react';
import { List, Button, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import type { ChatSession } from '../../lib/storage';

interface Props {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const { Text } = Typography;

export default function ChatHistorySidebar({ sessions, currentSessionId, onSelect, onCreate, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? 60 : 280,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          gap: 8,
        }}
      >
        {!collapsed && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
            New Chat
          </Button>
        )}
        {collapsed && <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block />}
        <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
      </div>
      {!collapsed && (
        <List
          dataSource={sessions}
          style={{ flex: 1, overflow: 'auto' }}
          renderItem={(session) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                />,
              ]}
              onClick={() => onSelect(session.id)}
              style={{
                backgroundColor: session.id === currentSessionId ? '#f0f5ff' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <List.Item.Meta
                title={<Text ellipsis>{session.title}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(session.updatedAt).toLocaleString()}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
