'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';

interface KVFormModalProps {
  open: boolean;
  namespace: string;
  editingKey: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function KVFormModal({ open, namespace, editingKey, onClose, onSuccess }: KVFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditing = !!editingKey;

  const fetchKeyValue = useCallback(async () => {
    if (!editingKey || !namespace) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kv/${encodeURIComponent(namespace)}/${encodeURIComponent(editingKey)}`);
      const data = (await response.json()) as { success: boolean; value?: string; error?: string };

      if (data.success) {
        form.setFieldsValue({
          key: editingKey,
          value: data.value,
          expirationTtl: undefined,
        });
      } else {
        message.error(data.error || 'Failed to fetch key');
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [editingKey, namespace, form]);

  useEffect(() => {
    if (open && editingKey) {
      fetchKeyValue();
    } else if (open) {
      form.resetFields();
    }
  }, [open, editingKey, fetchKeyValue, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEditing) {
        const encodedKey = encodeURIComponent(editingKey);
        const response = await fetch(`/api/admin/kv/${encodeURIComponent(namespace)}/${encodedKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: values.value,
            expirationTtl: values.expirationTtl,
          }),
        });
        const data = (await response.json()) as { success: boolean; error?: string };

        if (data.success) {
          message.success('Key updated successfully');
          form.resetFields();
          onSuccess();
        } else {
          message.error(data.error || 'Failed to update key');
        }
      } else {
        const response = await fetch(`/api/admin/kv/${encodeURIComponent(namespace)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = (await response.json()) as { success: boolean; error?: string };

        if (data.success) {
          message.success('Key created successfully');
          form.resetFields();
          onSuccess();
        } else {
          message.error(data.error || 'Failed to create key');
        }
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? `Edit Key: ${editingKey}` : 'Create New Key'}
      open={open}
      onOk={handleOk}
      onCancel={handleClose}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        {!isEditing && (
          <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Key is required' }]}>
            <Input placeholder="Enter key name" />
          </Form.Item>
        )}

        <Form.Item name="value" label="Value" rules={[{ required: true, message: 'Value is required' }]}>
          <Input.TextArea rows={6} placeholder="Enter value" style={{ fontFamily: 'monospace' }} />
        </Form.Item>

        <Form.Item
          name="expirationTtl"
          label="Expiration TTL (seconds)"
          extra="Leave empty for no expiration. Key will expire after this many seconds."
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g., 3600 for 1 hour" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
