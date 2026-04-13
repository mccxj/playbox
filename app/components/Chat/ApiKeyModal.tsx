'use client';

import { Modal, Input, Form } from 'antd';
import { useState } from 'react';
import { saveApiKey, getApiKey } from '../../lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initialValues = {
    apiKey: getApiKey() || '',
  };

  const handleOk = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      if (values.apiKey) {
        saveApiKey(values.apiKey);
      }
      onClose();
      form.resetFields();
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title="Set API Key"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={saving}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} initialValues={initialValues} layout="vertical">
        <Form.Item
          name="apiKey"
          label="API Key"
          rules={[{ required: true, message: 'Please enter your API key' }]}
        >
          <Input.Password placeholder="Enter your API key" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
