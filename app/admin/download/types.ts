export interface DownloadRecord {
  id: string;
  url: string;
  filename: string;
  size: number;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  rangeHeader?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DownloadStatsData {
  totalDownloads: number;
  successRate: number;
  totalSize: string;
  activeDownloads: number;
}

export interface DownloadFormData {
  url: string;
  customFilename?: string;
}

export interface DownloadHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: 'createdAt' | 'size' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DownloadHistoryResponse {
  success: boolean;
  records: DownloadRecord[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export interface CreateDownloadRequest {
  url: string;
  customFilename?: string;
}

export interface CreateDownloadResponse {
  success: boolean;
  record?: DownloadRecord;
  error?: string;
}
