'use client';

import { useState, useEffect, useCallback } from 'react';
import { R2Object, R2ListResponse } from '../types';

interface UseR2ObjectsParams {
	prefix?: string;
	limit?: number;
}

interface UseR2ObjectsReturn {
	objects: R2Object[];
	loading: boolean;
	error: string | null;
	truncated: boolean;
	cursor?: string;
	prefixes: string[];
	fetchObjects: (params?: UseR2ObjectsParams) => Promise<void>;
	loadMore: () => Promise<void>;
	refresh: () => Promise<void>;
}

export function useR2Objects(initialPrefix = '', initialLimit = 50): UseR2ObjectsReturn {
	const [objects, setObjects] = useState<R2Object[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [truncated, setTruncated] = useState(false);
	const [cursor, setCursor] = useState<string | undefined>();
	const [prefixes, setPrefixes] = useState<string[]>([]);
	const [currentPrefix, setCurrentPrefix] = useState(initialPrefix);
	const [currentLimit, setCurrentLimit] = useState(initialLimit);

	const fetchObjects = useCallback(async (params: UseR2ObjectsParams = {}) => {
		setLoading(true);
		setError(null);

		const searchParams = new URLSearchParams();
		const prefix = params.prefix ?? currentPrefix;
		const limit = params.limit ?? currentLimit;

		if (prefix) searchParams.set('prefix', prefix);
		searchParams.set('limit', limit.toString());

		try {
			const response = await fetch(`/api/admin/r2?${searchParams.toString()}`);
			const data: R2ListResponse = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to list objects');
			}

			setObjects(data.objects);
			setTruncated(data.truncated);
			setCursor(data.cursor);
			setPrefixes(data.delimitedPrefixes || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [currentPrefix, currentLimit]);

	const loadMore = useCallback(async () => {
		if (!truncated || !cursor) return;

		setLoading(true);
		setError(null);

		const searchParams = new URLSearchParams();
		if (currentPrefix) searchParams.set('prefix', currentPrefix);
		searchParams.set('limit', currentLimit.toString());
		searchParams.set('cursor', cursor);

		try {
			const response = await fetch(`/api/admin/r2?${searchParams.toString()}`);
			const data: R2ListResponse = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load more objects');
			}

			setObjects((prev) => [...prev, ...data.objects]);
			setTruncated(data.truncated);
			setCursor(data.cursor);
			setPrefixes((prev) => [...new Set([...prev, ...(data.delimitedPrefixes || [])])]);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [truncated, cursor, currentPrefix, currentLimit]);

	const refresh = useCallback(() => {
		return fetchObjects();
	}, [fetchObjects]);

	useEffect(() => {
		fetchObjects();
	}, []);

	return {
		objects,
		loading,
		error,
		truncated,
		cursor,
		prefixes,
		fetchObjects,
		loadMore,
		refresh,
	};
}
