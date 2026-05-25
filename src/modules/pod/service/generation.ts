import { BaseService } from '/@/cool';

class PodGenerationService extends BaseService {
	constructor() {
		super('admin/pod/generation');
	}

	createBatch(data: any) {
		return this.request({
			url: '/createBatch',
			method: 'POST',
			data,
			timeout: 180000
		});
	}

	runBatch(data: any) {
		return this.request({
			url: '/runBatch',
			method: 'POST',
			data
		});
	}

	retryFailed(data: any) {
		return this.request({
			url: '/retryFailed',
			method: 'POST',
			data
		});
	}

	retryItem(data: any) {
		return this.request({
			url: '/retryItem',
			method: 'POST',
			data
		});
	}

	retryItems(data: any) {
		return this.request({
			url: '/retryItems',
			method: 'POST',
			data
		});
	}

	updatePrompt(data: any) {
		return this.request({
			url: '/updatePrompt',
			method: 'POST',
			data
		});
	}

	approvePrompts(data: any) {
		return this.request({
			url: '/approvePrompts',
			method: 'POST',
			data
		});
	}

	rejectPrompts(data: any) {
		return this.request({
			url: '/rejectPrompts',
			method: 'POST',
			data
		});
	}

	detail(params: any) {
		return this.request({
			url: '/detail',
			params
		});
	}

	items(data: any) {
		return this.request({
			url: '/items',
			method: 'POST',
			data
		});
	}
}

export const podGenerationService = new PodGenerationService();
export default PodGenerationService;
