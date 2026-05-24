import { type ModuleConfig } from '/@/cool';

export default (): ModuleConfig => {
	return {
		label: 'POD生产',
		description: 'Temu/POD T恤印花批量生成工作流',
		views: [
			{
				path: '/pod/generation/detail/:id',
				meta: {
					label: '批次详情'
				},
				component: () => import('./views/item/index.vue')
			},
			{
				path: '/pod/images',
				meta: {
					label: '图片管理'
				},
				component: () => import('./views/image/index.vue')
			},
			{
				path: '/pod/setting',
				meta: {
					label: '模块设置'
				},
				component: () => import('./views/setting/index.vue')
			}
		]
	};
};
