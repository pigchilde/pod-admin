export function imageStatusText(status: string) {
	return (
		{
			pending: '待生成',
			running: '生成中',
			cutout_running: '抠图中',
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
			cutout_running: 'primary',
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

export function imagePreviewUrl(url: string, row: any) {
	if (!url) {
		return '';
	}
	if (url.includes('v=')) {
		return url;
	}
	const version = row.updateTime || row.createTime || Date.now();
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}v=${encodeURIComponent(version)}`;
}
