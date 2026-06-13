import { type ModuleConfig } from '/@/cool';

export default (): ModuleConfig => {
	return {
		label: 'POD生产',
		description: 'Temu/POD T恤印花批量生成工作流',
		views: [
			{
				// 批次详情是动态路由，只用于从批次列表进入，不直接展示在左侧菜单。
				path: '/pod/generation/detail/:id',
				meta: {
					label: '批次详情'
				},
				component: () => import('./views/item/index.vue')
			},
			{
				// 图片管理用于跨批次查看所有图片，后端会按创建时间倒序返回。
				path: '/pod/images',
				meta: {
					label: '图片管理',
					icon: 'icon-pic'
				},
				component: () => import('./views/image/index.vue')
			},
			{
				// 供应商配置拆分图片生成和提示词生成接口参数。
				path: '/pod/provider',
				meta: {
					label: '供应商配置',
					icon: 'icon-set'
				},
				component: () => import('./views/provider/index.vue')
			},
			{
				// 模块设置集中维护生图、提示词、抠图等运行期参数。
				path: '/pod/setting',
				meta: {
					label: '模块设置',
					icon: 'icon-set'
				},
				component: () => import('./views/setting/index.vue')
			}
		]
	};
};
