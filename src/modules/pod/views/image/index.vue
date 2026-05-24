<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-flex1 />
			<cl-select :options="options.status" prop="status" :width="120" placeholder="图片状态" />
			<cl-select
				:options="options.promptStatus"
				prop="promptStatus"
				:width="130"
				placeholder="提示词状态"
			/>
			<cl-search-key placeholder="搜索 prompt / 文件名 / 标题" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-imageUrl="{ scope }">
					<el-image
						v-if="scope.row.imageUrl"
						:src="scope.row.imageUrl"
						:preview-src-list="[scope.row.imageUrl]"
						preview-teleported
						fit="cover"
						class="preview"
					/>
					<div v-else class="empty">未生成</div>
				</template>

				<template #column-status="{ scope }">
					<el-tag :type="imageStatusType(scope.row.status)" effect="plain">
						{{ imageStatusText(scope.row.status) }}
					</el-tag>
				</template>

				<template #column-promptStatus="{ scope }">
					<el-tag :type="promptStatusType(scope.row.promptStatus)" effect="plain">
						{{ promptStatusText(scope.row.promptStatus) }}
					</el-tag>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-image-list'
});

import { useCrud, useTable } from '@cool-vue/crud';
import { reactive } from 'vue';
import { podGenerationService } from '../../service/generation';

const options = reactive({
	status: [
		{ label: '待生成', value: 'pending', type: 'info' },
		{ label: '成功', value: 'success', type: 'success' },
		{ label: '失败', value: 'failed', type: 'danger' }
	],
	promptStatus: [
		{ label: '待确认', value: 'draft', type: 'warning' },
		{ label: '已确认', value: 'approved', type: 'success' },
		{ label: '已驳回', value: 'rejected', type: 'danger' }
	]
});

const itemService = {
	page(data: any) {
		return podGenerationService.items(data);
	}
};

const Crud = useCrud(
	{
		service: itemService
	},
	app => {
		app.refresh();
	}
);

const Table = useTable({
	contextMenu: ['refresh'],
	columns: [
		{ prop: 'imageUrl', label: '图片', width: 120 },
		{ prop: 'itemNo', label: '编号', width: 80 },
		{ prop: 'status', label: '图片状态', width: 110 },
		{ prop: 'promptStatus', label: '提示词', width: 110 },
		{ prop: 'seoFileName', label: 'SEO文件名', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'seoTitle', label: '标题', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'prompt', label: 'Prompt', minWidth: 380, showOverflowTooltip: true },
		{ prop: 'filePath', label: '文件路径', minWidth: 260, showOverflowTooltip: true },
		{ prop: 'createTime', label: '创建时间', width: 170, sortable: 'desc' }
	]
});

function imageStatusText(status: string) {
	return ({ pending: '待生成', running: '生成中', success: '成功', failed: '失败' } as any)[
		status || 'pending'
	];
}

function imageStatusType(status: string) {
	return ({ pending: 'info', running: 'primary', success: 'success', failed: 'danger' } as any)[
		status || 'pending'
	];
}

function promptStatusText(status: string) {
	return ({ draft: '待确认', approved: '已确认', rejected: '已驳回' } as any)[
		status || 'draft'
	];
}

function promptStatusType(status: string) {
	return ({ draft: 'warning', approved: 'success', rejected: 'danger' } as any)[
		status || 'draft'
	];
}
</script>

<style lang="scss" scoped>
.preview,
.empty {
	width: 80px;
	height: 80px;
	border-radius: 6px;
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--el-text-color-secondary);
	background-color: var(--el-fill-color-light);
}
</style>
