'use client';

import { useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import dayjs from 'dayjs';

interface CreateKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newKey: { api_key: string; name: string }) => void;
}

export default function CreateKeyModal({ open, onClose, onSuccess }: CreateKeyModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body: { name: string; expires_at?: string } = {
        name: values.name,
      };

      if (values.expires_at) {
        body.expires_at = values.expires_at.toISOString();
      }

      const response = await fetch('/api/admin/llm-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { success?: boolean; error?: string; key?: { api_key: string; name: string } };

      if (data.success) {
        message.success('API key created successfully');
        form.resetFields();
        onSuccess({
          api_key: data.key!.api_key,
          name: data.key!.name,
        });
      } else {
        message.error(data.error || 'Failed to create API key');
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New API Key"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Create
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Key Name" rules={[{ required: true, message: 'Please enter a name for this API key' }]}>
          <Input placeholder="e.g., Production API Key" />
        </Form.Item>

        <Form.Item name="expires_at" label="Expiration Date (Optional)">
          <DatePicker
            showTime
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            placeholder="Leave empty for no expiration"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
