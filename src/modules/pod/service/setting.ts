import { BaseService } from '/@/cool';

class PodSettingService extends BaseService {
	constructor() {
		super('admin/pod/setting');
	}

	info() {
		// 后端会把数据库设置与默认配置合并后返回，前端无需自己兜底所有字段。
		return this.request({
			url: '/info'
		});
	}

	save(data: any) {
		// 保存时提交完整表单，后端会过滤并规范化不合法的尺寸、模型和数值范围。
		return this.request({
			url: '/save',
			method: 'POST',
			data
		});
	}
}

export const podSettingService = new PodSettingService();
export default PodSettingService;
