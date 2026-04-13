'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import type { ColumnInfo, TableRow } from '../types';

interface EditRowModalProps {
  open: boolean;
  table: string;
  columns: ColumnInfo[];
  row: TableRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRowModal({
  open,
  table,
  columns,
  row,
  onClose,
  onSuccess,
}: EditRowModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (row && open) {
      const values: Record<string, any> = {};
      columns.forEach(col => {
        values[col.name] = row[col.name];
      });
      form.setFieldsValue(values);
    }
  }, [row, columns, open, form]);

  const handleOk = async () => {
    if (!row) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await fetch(`/api/admin/tables/${table}/rows/${row._rowid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json() as any;

      if (data.success) {
        message.success('Row updated successfully');
        form.resetFields();
        onSuccess();
      } else {
        message.error(data.error || 'Failed to update row');
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
    if (column.type.toLowerCase().includes('real') || column.type.toLowerCase().includes('float') || column.type.toLowerCase().includes('double')) {
      return <InputNumber style={{ width: '100%' }} step="any" placeholder={`Enter ${column.name}`} />;
    }
    return <Input.TextArea rows={2} placeholder={`Enter ${column.name}`} />;
  };

  return (
    <Modal
      title={`Edit Row in ${table}`}
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
        {columns.map(column => (
          <Form.Item
            key={column.name}
            name={column.name}
            label={
              <span>
                {column.name}
                {column.pk ? ' (Primary Key)' : ''}
              </span>
            }
          >
            {renderInput(column)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
}
