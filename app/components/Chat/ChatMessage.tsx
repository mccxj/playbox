'use client';

import { ChatMessage as ChatMessageType } from '../../lib/chat-api';
import { Card, Collapse, Button, message as antdMessage } from 'antd';
import { UserOutlined, RobotOutlined, BulbOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './markdown.module.css';

interface Props {
  message: ChatMessageType;
  onDelete?: () => void;
}

export default function ChatMessage({ message, onDelete }: Props) {
  const isUser = message.role === 'user';
  const hasReasoning = !isUser && message.reasoning_content && message.reasoning_content.length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      antdMessage.success('Copied to clipboard');
    } catch (_err) {
      antdMessage.error('Failed to copy');
    }
  };

  return (
    <Card
      style={{
        maxWidth: '80%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        marginLeft: isUser ? 'auto' : 0,
        marginRight: isUser ? 0 : 'auto',
      }}
      bordered={false}
      actions={[
        <Button key="copy" type="text" icon={<CopyOutlined />} size="small" onClick={handleCopy} />,
        onDelete ? <Button key="delete" type="text" icon={<DeleteOutlined />} size="small" onClick={onDelete} /> : null,
      ].filter(Boolean)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {isUser ? <UserOutlined style={{ fontSize: 20 }} /> : <RobotOutlined style={{ fontSize: 20 }} />}
        <div style={{ flex: 1 }}>
          {hasReasoning && (
            <Collapse
              size="small"
              style={{ marginBottom: 12 }}
              items={[
                {
                  key: 'reasoning',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BulbOutlined />
                      <span>思考过程</span>
                    </span>
                  ),
                  children: (
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.6',
                      }}
                    >
                      {message.reasoning_content}
                    </div>
                  ),
                },
              ]}
            />
          )}
          <div className={styles.markdownContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </Card>
  );
}
