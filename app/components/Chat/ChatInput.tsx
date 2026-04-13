'use client';

import { Input, Button } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { useState, useRef } from 'react';

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ChatInput({ onSend, onStop, disabled, isLoading }: Props) {
  const [value, setValue] = useState('');
  const textAreaRef = useRef<TextAreaRef>(null);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

	return (
		<div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
			<div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
				<Input.TextArea
					ref={textAreaRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type a message... (Shift+Enter for new line)"
					autoSize={{ minRows: 1, maxRows: 4 }}
					disabled={disabled}
					style={{ flex: 1 }}
				/>
				{isLoading ? (
					<Button
						type="primary"
						icon={<StopOutlined />}
						onClick={onStop}
						disabled={disabled}
					>
						Stop
					</Button>
				) : (
					<Button
						type="primary"
						icon={<SendOutlined />}
						onClick={handleSend}
						disabled={!value.trim() || disabled}
					>
						Send
					</Button>
				)}
			</div>
		</div>
	);
}
