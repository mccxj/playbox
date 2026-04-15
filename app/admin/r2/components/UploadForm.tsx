'use client';

import { useState } from 'react';
import { Form, Upload, Button, Input, Space, message, Progress } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface UploadFormProps {
	currentPrefix: string;
	onUploadComplete: () => void;
}

export function UploadForm({ currentPrefix, onUploadComplete }: UploadFormProps) {
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [customKey, setCustomKey] = useState('');

	const handleUpload = async (file: File) => {
		setUploading(true);
		setUploadProgress(0);

		const key = customKey || `${currentPrefix}${file.name}`;

		try {
			const contentType = file.type || 'application/octet-stream';

			const xhr = new XMLHttpRequest();
			xhr.open('PUT', `/api/admin/r2/${encodeURIComponent(key)}`);
			xhr.setRequestHeader('Content-Type', contentType);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					setUploadProgress(Math.round((event.loaded / event.total) * 100));
				}
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					message.success(`Uploaded: ${key}`);
					onUploadComplete();
					setCustomKey('');
				} else {
					const error = JSON.parse(xhr.responseText);
					throw new Error(error.error || 'Upload failed');
				}
				setUploading(false);
				setUploadProgress(0);
			};

			xhr.onerror = () => {
				message.error('Upload failed');
				setUploading(false);
				setUploadProgress(0);
			};

			xhr.send(file);
		} catch (error) {
			message.error(error instanceof Error ? error.message : 'Upload failed');
			setUploading(false);
			setUploadProgress(0);
		}
	};

	const uploadProps: UploadProps = {
		multiple: false,
		showUploadList: false,
		beforeUpload: (file) => {
			handleUpload(file);
			return false;
		},
		disabled: uploading,
	};

	return (
		<div style={{ marginBottom: 24 }}>
			<Space.Compact style={{ width: '100%', marginBottom: 16 }}>
				<Input
					placeholder={`${currentPrefix}filename.ext`}
					value={customKey}
					onChange={(e) => setCustomKey(e.target.value)}
					disabled={uploading}
					style={{ width: '70%' }}
				/>
				<Upload {...uploadProps}>
					<Button type="primary" icon={<UploadOutlined />} loading={uploading} disabled={uploading}>
						Upload
					</Button>
				</Upload>
			</Space.Compact>

			{!customKey && (
				<Dragger {...uploadProps} style={{ marginTop: 16 }}>
					<p className="ant-upload-drag-icon">
						<InboxOutlined />
					</p>
					<p className="ant-upload-text">Click or drag file to upload</p>
					<p className="ant-upload-hint">
						Files will be uploaded to: {currentPrefix || '<root>'}
					</p>
				</Dragger>
			)}

			{uploading && uploadProgress > 0 && (
				<Progress percent={uploadProgress} status="active" style={{ marginTop: 16 }} />
			)}
		</div>
	);
}
