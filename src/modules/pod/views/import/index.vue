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

		<el-drawer v-model="drawer.visible" :title="drawer.title" size="960px">
			<div class="drawer-toolbar">
				<el-button type="warning" :loading="drawer.actionLoading" @click="repairCurrentImport">
					修复全部失败项
				</el-button>
			</div>
			<el-table v-loading="drawer.loading" :data="drawer.rows" border height="calc(100vh - 285px)">
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
				<el-table-column label="操作" width="120" fixed="right">
					<template #default="{ row }">
						<el-button
							v-if="!row.batchId && row.status === 'failed'"
							link
							type="primary"
							:loading="drawer.actionLoading"
							@click="retryRow(row)"
						>
							重试创建
						</el-button>
						<el-button
							v-else-if="row.batchId"
							link
							type="warning"
							:loading="drawer.actionLoading"
							@click="repairRow(row)"
						>
							修复批次
						</el-button>
						<span v-else class="empty-text">-</span>
					</template>
				</el-table-column>
			</el-table>
			<div class="drawer-pagination">
				<el-pagination
					v-model:current-page="drawer.pagination.page"
					v-model:page-size="drawer.pagination.size"
					:total="drawer.pagination.total"
					:page-sizes="[20, 50, 100]"
					layout="total, sizes, prev, pager, next, jumper"
					background
					@size-change="handleRowsSizeChange"
					@current-change="handleRowsPageChange"
				/>
			</div>
		</el-drawer>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-generation-import'
});

import { useCrud, useTable } from '@cool-vue/crud';
import { ElMessage, ElMessageBox } from 'element-plus';
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
	actionLoading: false,
	title: '',
	currentImportId: 0,
	pagination: {
		page: 1,
		size: 20,
		total: 0
	},
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
			width: 200,
			buttons: [
				{
					label: '行明细',
					type: 'primary',
					onClick({ scope }) {
						openRows(scope.row);
					}
				},
				{
					label: '修复',
					type: 'warning',
					onClick({ scope }) {
						repairImport(scope.row);
					}
				},
				{
					label: '删除',
					type: 'danger',
					onClick({ scope }) {
						removeImport(scope.row);
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
	drawer.currentImportId = row.id;
	drawer.pagination.page = 1;
	try {
		await reloadRows();
	} finally {
		drawer.loading = false;
	}
}

async function reloadRows() {
	if (!drawer.currentImportId) {
		return;
	}
	const res: any = await podGenerationImportService.rows({
		importId: drawer.currentImportId,
		page: drawer.pagination.page,
		size: drawer.pagination.size
	});
	drawer.rows = res?.list || [];
	drawer.pagination.total = res?.pagination?.total || 0;
	drawer.pagination.page = res?.pagination?.page || drawer.pagination.page;
	drawer.pagination.size = res?.pagination?.size || drawer.pagination.size;
}

async function handleRowsPageChange(page: number) {
	drawer.pagination.page = page;
	drawer.loading = true;
	try {
		await reloadRows();
	} finally {
		drawer.loading = false;
	}
}

async function handleRowsSizeChange(size: number) {
	drawer.pagination.size = size;
	drawer.pagination.page = 1;
	drawer.loading = true;
	try {
		await reloadRows();
	} finally {
		drawer.loading = false;
	}
}

async function retryRow(row: any) {
	await runImportAction(
		`确定重新创建第 ${row.rowNo} 行的批次？`,
		() => podGenerationImportService.retryRow({ id: row.id }),
		'重试创建完成'
	);
}

async function repairRow(row: any) {
	await runImportAction(
		`确定修复第 ${row.rowNo} 行关联批次的失败项？`,
		() => podGenerationImportService.repairRow({ id: row.id }),
		'修复完成'
	);
}

async function repairImport(row: any) {
	await runImportAction(
		`确定修复导入记录 ${row.importNo} 的失败项？`,
		() => podGenerationImportService.repairImport({ id: row.id }),
		'修复完成'
	);
}

async function removeImport(row: any) {
	try {
		await ElMessageBox.confirm(
			`将删除导入记录「${row.importNo}」及其导入行明细，不会删除已创建的批次和图片，是否继续？`,
			'提示',
			{ type: 'warning' }
		);
	} catch {
		return;
	}

	try {
		await podGenerationImportService.delete({ ids: [row.id] });
		ElMessage.success('导入记录已删除');
		if (drawer.currentImportId === row.id) {
			drawer.visible = false;
			drawer.currentImportId = 0;
			drawer.rows = [];
		}
		Crud.value?.refresh();
	} catch (err: any) {
		ElMessage.error(err?.message || '删除失败');
	}
}

async function repairCurrentImport() {
	if (!drawer.currentImportId) {
		return;
	}
	await runImportAction(
		'确定修复当前导入记录的全部失败项？',
		() => podGenerationImportService.repairImport({ id: drawer.currentImportId }),
		'修复完成'
	);
}

async function runImportAction(message: string, action: () => Promise<any>, successText: string) {
	try {
		await ElMessageBox.confirm(message, '提示', { type: 'warning' });
	} catch {
		return;
	}
	drawer.actionLoading = true;
	try {
		await action();
		ElMessage.success(successText);
		await reloadRows();
		Crud.value?.refresh();
	} catch (err: any) {
		ElMessage.error(err?.message || '操作失败');
	} finally {
		drawer.actionLoading = false;
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

.drawer-toolbar {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 12px;
}

.drawer-pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 12px;
}

.empty-text {
	color: var(--el-text-color-placeholder);
}
</style>
