'use client';

import { useState } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import type { ColumnInfo } from '../types';

interface CreateRowModalProps {
  open: boolean;
  table: string;
  columns: ColumnInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRowModal({ open, table, columns, onClose, onSuccess }: CreateRowModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await fetch(`/api/admin/tables/${table}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as any;

      if (data.success) {
        message.success('Row created successfully');
        form.resetFields();
        onSuccess();
      } else {
        message.error(data.error || 'Failed to create row');
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (column: ColumnInfo) => {
    if (column.type.toLowerCase().includes('int')) {
      return <InputNumber style={{ width: '100%' }} placeholder={`Enter ${column.name}`} />;
    }
    if (
      column.type.toLowerCase().includes('real') ||
      column.type.toLowerCase().includes('float') ||
      column.type.toLowerCase().includes('double')
    ) {
      return <InputNumber style={{ width: '100%' }} step="any" placeholder={`Enter ${column.name}`} />;
    }
    return <Input.TextArea rows={2} placeholder={`Enter ${column.name}`} />;
  };

  return (
    <Modal
      title={`Create New Row in ${table}`}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        {columns.map((column) => (
          <Form.Item
            key={column.name}
            name={column.name}
            label={
              <span>
                {column.name}
                {column.pk ? ' (Primary Key)' : ''}
                {column.notnull ? ' *' : ''}
              </span>
            }
            rules={[{ required: column.notnull === 1, message: `${column.name} is required` }]}
          >
            {renderInput(column)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
}
