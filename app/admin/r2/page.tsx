'use client';

import { useState, useMemo } from 'react';
import { Card, Breadcrumb, Button, Space, Alert, Typography, message } from 'antd';
import { HomeOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { R2ObjectList } from './components/R2ObjectList';
import { UploadForm } from './components/UploadForm';
import { useR2Objects } from './hooks/useR2Objects';

const { Title } = Typography;

export default function R2Page() {
	const [currentPrefix, setCurrentPrefix] = useState('');
	const {
		objects,
		loading,
		error,
		truncated,
		prefixes,
		fetchObjects,
		loadMore,
		refresh,
	} = useR2Objects(currentPrefix);

	const prefixParts = useMemo(() => {
		if (!currentPrefix) return [];
		return currentPrefix.replace(/\/$/, '').split('/');
	}, [currentPrefix]);

	const handlePrefixClick = (prefix: string) => {
		setCurrentPrefix(prefix);
	};

	const handleBreadcrumbClick = (index: number) => {
		if (index === -1) {
			setCurrentPrefix('');
		} else {
			const newPrefix = prefixParts.slice(0, index + 1).join('/') + '/';
			setCurrentPrefix(newPrefix);
		}
	};

	const handleDelete = async (key: string) => {
		try {
			const response = await fetch(`/api/admin/r2/${encodeURIComponent(key)}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json() as { error?: string };
				throw new Error(errorData.error || 'Failed to delete object');
			}

			message.success('Object deleted');
			refresh();
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Failed to delete object');
		}
	};

	const handleDownload = (key: string) => {
		window.open(`/api/admin/r2/${encodeURIComponent(key)}`, '_blank');
	};

	const handleUploadComplete = () => {
		refresh();
	};

	return (
		<div>
			{error && (
				<Alert
					message="Error"
					description={error}
					type="error"
					closable
					onClose={() => {}}
					style={{ marginBottom: 24 }}
				/>
			)}

			<Card style={{ marginBottom: 24 }}>
				<Space direction="vertical" style={{ width: '100%' }} size="middle">
					<Space style={{ width: '100%', justifyContent: 'space-between' }}>
						<Space>
							{currentPrefix && (
								<Button
									icon={<ArrowLeftOutlined />}
									onClick={() => {
										const parts = prefixParts.slice(0, -1);
										setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '');
									}}
								>
									Back
								</Button>
							)}
							<Breadcrumb>
								<Breadcrumb.Item>
									<a onClick={() => handleBreadcrumbClick(-1)}>
										<HomeOutlined /> Root
									</a>
								</Breadcrumb.Item>
								{prefixParts.map((part, index) => (
									<Breadcrumb.Item key={index}>
										<a onClick={() => handleBreadcrumbClick(index)}>{part}</a>
									</Breadcrumb.Item>
								))}
							</Breadcrumb>
						</Space>
						<Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
							Refresh
						</Button>
					</Space>

					<UploadForm currentPrefix={currentPrefix} onUploadComplete={handleUploadComplete} />
				</Space>
			</Card>

			<Card title={`Objects ${currentPrefix ? `(${currentPrefix})` : ''}`}>
				<R2ObjectList
					objects={objects}
					prefixes={prefixes}
					loading={loading}
					truncated={truncated}
					onDelete={handleDelete}
					onDownload={handleDownload}
					onPrefixClick={handlePrefixClick}
					onLoadMore={loadMore}
				/>
			</Card>
		</div>
	);
}
