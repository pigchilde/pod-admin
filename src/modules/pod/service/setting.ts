import { BaseService } from '/@/cool';

class PodSettingService extends BaseService {
	constructor() {
		super('admin/pod/setting');
	}

	info() {
		return this.request({
			url: '/info'
		});
	}

	save(data: any) {
		return this.request({
			url: '/save',
			method: 'POST',
			data
		});
	}
}

export const podSettingService = new PodSettingService();
export default PodSettingService;
