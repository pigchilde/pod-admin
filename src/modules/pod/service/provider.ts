import { BaseService } from '/@/cool';

class PodProviderService extends BaseService {
	constructor() {
		super('admin/pod/provider');
	}

	options(params?: { type?: 'image' | 'prompt' }) {
		return this.request({
			url: '/options',
			params
		});
	}
}

export const podProviderService = new PodProviderService();
export default PodProviderService;
