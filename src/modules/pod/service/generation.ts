import { BaseService } from '/@/cool';

class PodGenerationService extends BaseService {
	constructor() {
		super('admin/pod/generation');
	}

	createBatch(data: any) {
		// 创建批次会同步生成提示词；如开启自动生图，后端会异步继续生成图片。
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

	cutoutItem(data: any) {
		// 手动抠图只处理已有图片，不重新消耗图片模型额度。
		return this.request({
			url: '/cutoutItem',
			method: 'POST',
			data,
			timeout: 180000
		});
	}

	generateMockupItem(data: any) {
		// 效果图由本地 T.png 模板合成，重复点击会覆盖同名 JPG。
		return this.request({
			url: '/generateMockupItem',
			method: 'POST',
			data,
			timeout: 180000
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
		// 批次详情和图片管理共用任务项分页接口，排序由调用方和后端共同决定。
		return this.request({
			url: '/items',
			method: 'POST',
			data
		});
	}
}

export const podGenerationService = new PodGenerationService();
export default PodGenerationService;
