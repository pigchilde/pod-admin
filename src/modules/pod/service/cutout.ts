import { BaseService } from '/@/cool';

class PodCutoutService extends BaseService {
	constructor() {
		super('admin/pod/cutout');
	}

	upload(data: FormData) {
		return this.request({
			url: '/upload',
			method: 'POST',
			data,
			headers: {
				'Content-Type': 'multipart/form-data'
			},
			timeout: 600000
		});
	}
}

export const podCutoutService = new PodCutoutService();
export default PodCutoutService;
