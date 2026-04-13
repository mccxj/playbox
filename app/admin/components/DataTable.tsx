'use client';

import { Table, Button, Space, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { TableRow, ColumnInfo } from '../types';

const { Text } = Typography;

interface DataTableProps {
  columns: ColumnInfo[];
  rows: TableRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  selectedRowKeys: React.Key[];
  onRowSelect: (keys: React.Key[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onSort: (column: string, order: 'asc' | 'desc' | null) => void;
  onEdit: (row: TableRow) => void;
  onDelete: (rowid: number) => void;
  onBatchDelete: () => void;
  loading: boolean;
}

export default function DataTable({
  columns,
  rows,
  pagination,
  selectedRowKeys,
  onRowSelect,
  onPageChange,
  onSort,
  onEdit,
  onDelete,
  onBatchDelete,
  loading,
}: DataTableProps) {
  const tableColumns: ColumnsType<TableRow> = [
    {
      title: 'rowid',
      dataIndex: '_rowid',
      key: '_rowid',
      width: 80,
      sorter: true,
    },
    ...columns.map(col => ({
      title: col.name,
      dataIndex: col.name,
      key: col.name,
      ellipsis: true,
      sorter: true,
      render: (value: any) => {
        if (value === null || value === undefined) {
          return <Text type="secondary">NULL</Text>;
        }
        if (typeof value === 'object') {
          return <Text code>{JSON.stringify(value)}</Text>;
        }
        return String(value);
      },
    })),
    {
      title: 'Actions',
      key: '_actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this row?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record._rowid)}
            okText="Delete"
            okType="danger"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection: TableProps<TableRow>['rowSelection'] = {
    selectedRowKeys,
    onChange: (keys) => onRowSelect(keys),
  };

  return (
    <div>
      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Popconfirm
            title={`Delete ${selectedRowKeys.length} selected rows?`}
            description="This action cannot be undone."
            onConfirm={onBatchDelete}
            okText="Delete All"
            okType="danger"
          >
            <Button danger>Delete Selected ({selectedRowKeys.length})</Button>
          </Popconfirm>
        </div>
      )}
      <Table
        columns={tableColumns}
        dataSource={rows}
        rowKey="_rowid"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} rows`,
          onChange: onPageChange,
        }}
        onChange={(pagination, filters, sorter: any) => {
          if (sorter.field) {
            onSort(
              sorter.field as string,
              sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : null
            );
          }
        }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </div>
  );
}
