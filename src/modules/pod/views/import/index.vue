<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-flex1 />
			<cl-select :options="options.status" prop="status" :width="140" placeholder="导入状态" />
			<cl-search-key placeholder="搜索导入编号 / 文件名 / 错误" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-status="{ scope }">
					<el-tag :type="statusType(scope.row.status)" effect="plain">
						{{ statusText(scope.row.status) }}
					</el-tag>
				</template>

				<template #column-progress="{ scope }">
					{{ scope.row.successRows || 0 }} / {{ scope.row.totalRows || 0 }}
					<el-text v-if="scope.row.failedRows" type="danger" class="failed">
						失败 {{ scope.row.failedRows }}
					</el-text>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<el-drawer v-model="drawer.visible" :title="drawer.title" size="760px">
			<el-table v-loading="drawer.loading" :data="drawer.rows" border height="calc(100vh - 180px)">
				<el-table-column prop="rowNo" label="行号" width="72" />
				<el-table-column prop="topic" label="主题" min-width="180" show-overflow-tooltip />
				<el-table-column prop="count" label="数量" width="72" />
				<el-table-column prop="status" label="状态" width="100">
					<template #default="{ row }">
						<el-tag :type="rowStatusType(row.status)" effect="plain">
							{{ rowStatusText(row.status) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="batchNo" label="批次" min-width="180" show-overflow-tooltip>
					<template #default="{ row }">
						<el-link v-if="row.batchId" type="primary" @click="goBatch(row.batchId)">
							{{ row.batchNo || row.batchId }}
						</el-link>
						<span v-else class="empty-text">未创建</span>
					</template>
				</el-table-column>
				<el-table-column prop="batchStatus" label="批次状态" width="110">
					<template #default="{ row }">
						<el-tag v-if="row.batchStatus" :type="batchStatusType(row.batchStatus)" effect="plain">
							{{ batchStatusText(row.batchStatus) }}
						</el-tag>
						<span v-else class="empty-text">-</span>
					</template>
				</el-table-column>
				<el-table-column prop="batchProgress" label="图片进度" width="120">
					<template #default="{ row }">
						<span v-if="row.batchId">{{ row.batchSuccessCount || 0 }} / {{ row.batchCount || row.count || 0 }}</span>
						<span v-else class="empty-text">-</span>
					</template>
				</el-table-column>
				<el-table-column prop="postProcessFailed" label="后处理失败" width="190">
					<template #default="{ row }">
						<template v-if="row.batchId">
							<el-text v-if="row.cutoutFailedCount" type="danger" class="failed">
								抠图 {{ row.cutoutFailedCount }}
							</el-text>
							<el-text v-if="row.mockupFailedCount" type="danger" class="failed">
								效果图 {{ row.mockupFailedCount }}
							</el-text>
							<el-text v-if="row.verifyFailedCount" type="danger" class="failed">
								检查 {{ row.verifyFailedCount }}
							</el-text>
							<span
								v-if="!row.cutoutFailedCount && !row.mockupFailedCount && !row.verifyFailedCount"
								class="empty-text"
							>
								无
							</span>
						</template>
						<span v-else class="empty-text">-</span>
					</template>
				</el-table-column>
				<el-table-column prop="error" label="错误" min-width="180" show-overflow-tooltip />
			</el-table>
		</el-drawer>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-generation-import'
});

import { useCrud, useTable } from '@cool-vue/crud';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { podGenerationImportService } from '../../service/import';

const router = useRouter();

const options = reactive({
	status: [
		{ label: '处理中', value: 'processing', type: 'primary' },
		{ label: '导入完成', value: 'completed', type: 'success' },
		{ label: '导入部分失败', value: 'partial_failed', type: 'warning' },
		{ label: '导入失败', value: 'failed', type: 'danger' }
	]
});

const drawer = reactive({
	visible: false,
	loading: false,
	title: '',
	rows: [] as any[]
});

const Crud = useCrud(
	{
		service: podGenerationImportService
	},
	app => {
		app.refresh();
	}
);

const Table = useTable({
	contextMenu: ['refresh'],
	columns: [
		{ prop: 'id', label: 'ID', width: 90 },
		{ prop: 'importNo', label: '导入编号', minWidth: 190, showOverflowTooltip: true },
		{ prop: 'fileName', label: '文件名', minWidth: 180, showOverflowTooltip: true },
		{ prop: 'status', label: '状态', width: 120 },
		{ prop: 'progress', label: '行进度', width: 140 },
		{ prop: 'totalImages', label: '计划图片', width: 100 },
		{ prop: 'error', label: '错误', minWidth: 160, showOverflowTooltip: true },
		{ prop: 'createTime', label: '创建时间', width: 170, sortable: 'desc' },
		{
			type: 'op',
			width: 150,
			buttons: [
				{
					label: '行明细',
					type: 'primary',
					onClick({ scope }) {
						openRows(scope.row);
					}
				}
			]
		}
	]
});

function statusText(status: string) {
	return (
		{
			processing: '处理中',
			completed: '导入完成',
			partial_failed: '导入部分失败',
			failed: '导入失败'
		} as Record<string, string>
	)[status || 'processing'];
}

function statusType(status: string) {
	return (
		{
			processing: 'primary',
			completed: 'success',
			partial_failed: 'warning',
			failed: 'danger'
		} as Record<string, any>
	)[status || 'processing'];
}

function rowStatusText(status: string) {
	return (
		{
			pending: '待处理',
			created: '已创建',
			failed: '失败'
		} as Record<string, string>
	)[status || 'pending'];
}

function batchStatusText(status: string) {
	return (
		{
			prompt_generating: '生成提示词',
			prompt_ready: '待确认',
			image_generating: '生成图片',
			completed: '已完成',
			partial_failed: '部分失败',
			failed: '失败'
		} as Record<string, string>
	)[status || 'prompt_ready'];
}

function batchStatusType(status: string) {
	return (
		{
			prompt_generating: 'primary',
			prompt_ready: 'warning',
			image_generating: 'primary',
			completed: 'success',
			partial_failed: 'warning',
			failed: 'danger'
		} as Record<string, any>
	)[status || 'prompt_ready'];
}

function rowStatusType(status: string) {
	return (
		{
			pending: 'info',
			created: 'success',
			failed: 'danger'
		} as Record<string, any>
	)[status || 'pending'];
}

async function openRows(row: any) {
	drawer.visible = true;
	drawer.loading = true;
	drawer.title = `导入行明细：${row.importNo}`;
	try {
		const res: any = await podGenerationImportService.rows({
			importId: row.id,
			page: 1,
			size: 100
		});
		drawer.rows = res?.list || [];
	} finally {
		drawer.loading = false;
	}
}

function goBatch(id: number) {
	router.push(`/pod/generation/detail/${id}`);
}
</script>

<style lang="scss" scoped>
.failed {
	margin-left: 8px;
}

.empty-text {
	color: var(--el-text-color-placeholder);
}
</style>
