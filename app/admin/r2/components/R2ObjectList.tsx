'use client';

import { Table, Button, Space, Tag, Popconfirm, message, Typography } from 'antd';
import { DeleteOutlined, DownloadOutlined, CopyOutlined, FileOutlined, FolderOutlined } from '@ant-design/icons';
import { R2Object } from '../types';

const { Text } = Typography;

interface R2ObjectListProps {
	objects: R2Object[];
	prefixes: string[];
	loading: boolean;
	truncated: boolean;
	onDelete: (key: string) => Promise<void>;
	onDownload: (key: string) => void;
	onPrefixClick: (prefix: string) => void;
	onLoadMore: () => void;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function R2ObjectList({
	objects,
	prefixes,
	loading,
	truncated,
	onDelete,
	onDownload,
	onPrefixClick,
	onLoadMore,
}: R2ObjectListProps) {
	const handleCopyKey = (key: string) => {
		navigator.clipboard.writeText(key);
		message.success('Key copied to clipboard');
	};

	const prefixItems = prefixes.map((prefix) => ({
		key: `prefix:${prefix}`,
		name: prefix.replace(/\/$/, '').split('/').pop() || prefix,
		fullKey: prefix,
		type: 'folder' as const,
	}));

	const objectItems = objects.map((obj) => ({
		name: obj.key.split('/').pop() || obj.key,
		fullKey: obj.key,
		type: 'file' as const,
		...obj,
	}));

	const allItems = [...prefixItems, ...objectItems];

	return (
		<Space direction="vertical" style={{ width: '100%' }} size="large">
			<Table
				dataSource={allItems}
				loading={loading}
				rowKey="key"
				pagination={false}
				size="small"
				columns={[
					{
						title: 'Name',
						dataIndex: 'name',
						key: 'name',
						render: (name: string, record: any) => (
							<Space>
								{record.type === 'folder' ? (
									<FolderOutlined style={{ color: '#1890ff' }} />
								) : (
									<FileOutlined style={{ color: '#52c41a' }} />
								)}
								{record.type === 'folder' ? (
									<a onClick={() => onPrefixClick(record.fullKey)}>{name}</a>
								) : (
									<Text>{name}</Text>
								)}
							</Space>
						),
					},
					{
						title: 'Key',
						dataIndex: 'fullKey',
						key: 'fullKey',
						render: (key: string) => (
							<Text type="secondary" style={{ fontSize: 12 }}>
								{key}
							</Text>
						),
					},
					{
						title: 'Size',
						dataIndex: 'size',
						key: 'size',
						width: 100,
						render: (size: number | undefined, record: any) =>
							record.type === 'folder' ? (
								<Tag>-</Tag>
							) : (
								<Tag color="blue">{formatBytes(size || 0)}</Tag>
							),
					},
					{
						title: 'Last Modified',
						dataIndex: 'lastModified',
						key: 'lastModified',
						width: 180,
						render: (date: string | undefined, record: any) =>
							record.type === 'folder' ? '-' : date ? new Date(date).toLocaleString() : '-',
					},
					{
						title: 'Actions',
						key: 'actions',
						width: 120,
						render: (_: any, record: any) => (
							<Space size="small">
								{record.type === 'folder' ? null : (
									<>
										<Button
											type="text"
											size="small"
											icon={<DownloadOutlined />}
											onClick={() => onDownload(record.fullKey)}
											title="Download"
										/>
										<Button
											type="text"
											size="small"
											icon={<CopyOutlined />}
											onClick={() => handleCopyKey(record.fullKey)}
											title="Copy key"
										/>
										<Popconfirm
											title="Delete this object?"
											description="This action cannot be undone."
											onConfirm={() => onDelete(record.fullKey)}
											okText="Delete"
											cancelText="Cancel"
											okButtonProps={{ danger: true }}
										>
											<Button
												type="text"
												size="small"
												danger
												icon={<DeleteOutlined />}
												title="Delete"
											/>
										</Popconfirm>
									</>
								)}
							</Space>
						),
					},
				]}
			/>
			{truncated && (
				<div style={{ textAlign: 'center' }}>
					<Button onClick={onLoadMore} loading={loading}>
						Load More
					</Button>
				</div>
			)}
		</Space>
	);
}
