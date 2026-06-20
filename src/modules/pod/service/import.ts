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
}

export const podGenerationImportService = new PodGenerationImportService();
export default PodGenerationImportService;
