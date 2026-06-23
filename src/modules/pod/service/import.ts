import { BaseService } from '/@/cool';

class PodGenerationImportService extends BaseService {
	constructor() {
		super('admin/pod/import');
	}

	detail(params: any) {
		return this.request({
			url: '/detail',
			params
		});
	}

	rows(data: any) {
		return this.request({
			url: '/rows',
			method: 'POST',
			data
		});
	}

	queueStats(params: any) {
		return this.request({
			url: '/queueStats',
			params
		});
	}

	retryRow(data: any) {
		return this.request({
			url: '/retryRow',
			method: 'POST',
			data,
			timeout: 180000
		});
	}

	repairRow(data: any) {
		return this.request({
			url: '/repairRow',
			method: 'POST',
			data,
			timeout: 180000
		});
	}

	repairImport(data: any) {
		return this.request({
			url: '/repairImport',
			method: 'POST',
			data,
			timeout: 600000
		});
	}

	runImport(data: any) {
		return this.request({
			url: '/runImport',
			method: 'POST',
			data,
			timeout: 600000
		});
	}
}

export const podGenerationImportService = new PodGenerationImportService();
export default PodGenerationImportService;
