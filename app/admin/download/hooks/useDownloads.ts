'use client';

import { useState, useEffect, useCallback } from 'react';
import { DownloadRecord, DownloadHistoryParams, DownloadHistoryResponse } from '../types';
import { message } from 'antd';

const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options?: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface UseDownloadsReturn {
  downloads: DownloadRecord[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  fetchDownloads: (params?: Partial<DownloadHistoryParams>) => Promise<void>;
  setParams: (params: Partial<DownloadHistoryParams>) => void;
}

export function useDownloads(): UseDownloadsReturn {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortField] = useState<'createdAt' | 'size' | 'status'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDownloads = useCallback(
    async (params?: Partial<DownloadHistoryParams>) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', params?.page?.toString() || page.toString());
        queryParams.set('pageSize', pageSize.toString());
        queryParams.set('sortBy', sortField);
        queryParams.set('sortOrder', sortOrder);

        if (params?.status || statusFilter) {
          queryParams.set('status', params?.status || statusFilter);
        }
        if (params?.search || searchQuery) {
          queryParams.set('search', params?.search || searchQuery);
        }

        const response = await fetchWithTimeout(`/api/admin/download/history?${queryParams}`);
        const data = (await response.json()) as DownloadHistoryResponse;

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch download history');
        }

        setDownloads(data.records);
        setTotal(data.total);

        if (params?.page) {
          setPage(params.page);
        }
      } catch (err) {
        let errorMessage = 'Failed to fetch download history';
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'Request timeout. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, sortField, sortOrder, statusFilter, searchQuery]
  );

  const setParams = useCallback((params: Partial<DownloadHistoryParams>) => {
    if (params.status !== undefined) {
      setStatusFilter(params.status);
    }
    if (params.search !== undefined) {
      setSearchQuery(params.search);
    }
    if (params.page !== undefined) {
      setPage(params.page);
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  return {
    downloads,
    loading,
    error,
    page,
    pageSize,
    total,
    fetchDownloads,
    setParams,
  };
}
