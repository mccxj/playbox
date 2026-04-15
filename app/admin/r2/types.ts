export interface R2Object {
	key: string;
	size: number;
	etag: string;
	lastModified: string;
	httpContentType?: string;
	httpEtag?: string;
}

export interface R2ListResponse {
	success: boolean;
	objects: R2Object[];
	truncated: boolean;
	cursor?: string;
	delimitedPrefixes?: string[];
	error?: string;
}
