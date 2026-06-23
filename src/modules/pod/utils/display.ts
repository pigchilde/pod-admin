export function imageStatusText(status: string) {
	return (
		{
			pending: '待生成',
			running: '生成中',
			success: '成功',
			failed: '失败'
		} as Record<string, string>
	)[status || 'pending'];
}

export function imageStatusType(status: string) {
	return (
		{
			pending: 'info',
			running: 'primary',
			success: 'success',
			failed: 'danger'
		} as Record<string, any>
	)[status || 'pending'];
}

export function promptStatusText(status: string) {
	return (
		{
			draft: '待确认',
			approved: '已确认',
			rejected: '已驳回'
		} as Record<string, string>
	)[status || 'draft'];
}

export function promptStatusType(status: string) {
	return (
		{
			draft: 'warning',
			approved: 'success',
			rejected: 'danger'
		} as Record<string, any>
	)[status || 'draft'];
}

export function imagePreviewUrl(url: string, cacheKey: string | number) {
	if (!url) {
		return '';
	}

	const cleanUrl = String(url).split(/[?#]/)[0];
	return `${cleanUrl}?_t=${encodeURIComponent(cacheKey || Date.now())}`;
}
