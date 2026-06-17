<template>
	<cl-crud ref="Crud">
		<cl-row>
			<el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
			<cl-refresh-btn />
			<el-button
				type="primary"
				:loading="actionLoading"
				:disabled="actionLoading || !canApproveSelection"
				@click="approveSelection"
			>
				确认提示词
			</el-button>
			<el-button
				type="success"
				:loading="actionLoading"
				:disabled="actionLoading || !canRun"
				@click="run"
			>
				生成待生成
			</el-button>
			<el-button
				type="warning"
				:loading="actionLoading"
				:disabled="actionLoading || !canRetrySelection"
				@click="retrySelection"
			>
				重生成选中
			</el-button>
			<el-button
				type="primary"
				:loading="actionLoading"
				:disabled="actionLoading || !canCutoutSelection"
				@click="cutoutSelection"
			>
				选中抠图
			</el-button>
			<el-button type="warning" :loading="actionLoading" :disabled="actionLoading || !batch?.failedCount" @click="retryFailed">
				重试失败
			</el-button>
			<cl-flex1 />
			<el-text v-if="batch">
				{{ batch.topic }}｜提示词 {{ batch.approvedPromptCount || 0 }}/{{ batch.promptCount || 0 }}｜图片
				{{ batch.successCount || 0 }}/{{ batch.count }}
			</el-text>
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-imageUrl="{ scope }">
					<el-image
						v-if="scope.row.imageUrl"
						:src="imagePreviewUrl(scope.row.imageUrl, imageCacheKey)"
						:preview-src-list="[imagePreviewUrl(scope.row.imageUrl, imageCacheKey)]"
						preview-teleported
						fit="cover"
						class="preview"
					/>
					<div v-else class="empty">未生成</div>
				</template>

				<template #column-mockupImageUrl="{ scope }">
					<el-image
						v-if="scope.row.mockupImageUrl"
						:src="imagePreviewUrl(scope.row.mockupImageUrl, imageCacheKey)"
						:preview-src-list="[imagePreviewUrl(scope.row.mockupImageUrl, imageCacheKey)]"
						preview-teleported
						fit="cover"
						class="preview"
					/>
					<div v-else class="empty">未生成</div>
				</template>

				<template #column-promptStatus="{ scope }">
					<el-tag :type="promptStatusType(scope.row.promptStatus)" effect="plain">
						{{ promptStatusText(scope.row.promptStatus) }}
					</el-tag>
				</template>

				<template #column-status="{ scope }">
					<el-tag :type="imageStatusType(scope.row.status)" effect="plain">
						{{ imageStatusText(scope.row.status) }}
					</el-tag>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-form ref="Form" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-generation-detail'
});

import { useCrud, useForm, useTable } from '@cool-vue/crud';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { podGenerationService } from '../../service/generation';
import { imagePreviewUrl, imageStatusText, imageStatusType, promptStatusText, promptStatusType } from '../../utils/display';

const route = useRoute();
const router = useRouter();
const Form = useForm();
const batch = ref<any>();
const actionLoading = ref(false);
const imageCacheKey = ref(Date.now());

const pendingImageCount = computed(() =>
	Math.max(
		(batch.value?.approvedPromptCount || 0) -
			(batch.value?.successCount || 0) -
			(batch.value?.failedCount || 0),
		0
	)
);

const canRun = computed(() => pendingImageCount.value > 0 && batch.value?.status !== 'image_generating');

const itemService = {
	page(data: any) {
		// 批次详情固定限定 batchId，后端会保持 001、002、003 的任务顺序。
		return podGenerationService.items({
			...data,
			batchId: Number(route.params.id)
		});
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

const isGenerating = (row: any) => row.status === 'running';
const isCutoutRunning = (row: any) => row.status === 'cutout_running';
const isBusy = (row: any) => isGenerating(row) || isCutoutRunning(row);
const canOperateImage = (row: any) => row.promptStatus === 'approved' && !isBusy(row);
const canCutoutRow = (row: any) => Boolean(row.imageUrl) && canOperateImage(row);
const canMockupRow = (row: any) => Boolean(row.imageUrl) && !isBusy(row);

const Table = useTable({
	contextMenu: ['refresh', 'check'],
	columns: [
		{ type: 'selection' },
		{ prop: 'imageUrl', label: '图片', width: 120 },
		{ prop: 'mockupImageUrl', label: '效果图', width: 120 },
		{ prop: 'itemNo', label: '编号', width: 70 },
		{ prop: 'promptStatus', label: '提示词', width: 110 },
		{ prop: 'status', label: '图片状态', width: 110 },
		{ prop: 'seoFileName', label: 'SEO文件名', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'seoTitle', label: '标题', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'prompt', label: 'Prompt', minWidth: 380, showOverflowTooltip: true },
		{ prop: 'error', label: '错误', minWidth: 180, showOverflowTooltip: true },
		{
			type: 'op',
			width: 390,
			buttons({ scope }) {
				return [
					{
						label: '编辑',
						type: 'primary',
						disabled: actionLoading.value,
						onClick() {
							openPrompt(scope.row);
						}
					},
					{
						label: '确认',
						type: 'success',
						disabled: actionLoading.value,
						hidden: scope.row.promptStatus === 'approved',
						onClick() {
							approve([scope.row]);
						}
					},
					{
						label: '生图',
						type: 'warning',
						disabled: actionLoading.value || !canOperateImage(scope.row),
						onClick() {
							retryItem(scope.row);
						}
					},
					{
						label: '抠图',
						type: 'primary',
						disabled: actionLoading.value || !canCutoutRow(scope.row),
						onClick() {
							cutoutItem(scope.row);
						}
					},
					{
						label: '生成效果图',
						type: 'success',
						disabled: actionLoading.value || !canMockupRow(scope.row),
						onClick() {
							generateMockupItem(scope.row);
						}
					}
				];
			}
		}
	]
});

const selectedRows = computed(() => Table.value?.selection || []);

const selectedDraftRows = computed(() =>
	selectedRows.value.filter((row: any) => row.promptStatus === 'draft')
);

const selectedRetryRows = computed(() =>
	selectedRows.value.filter((row: any) => canOperateImage(row))
);

const selectedCutoutRows = computed(() =>
	selectedRows.value.filter((row: any) => canCutoutRow(row))
);

const canApproveSelection = computed(() => selectedDraftRows.value.length > 0);

const canRetrySelection = computed(
	() => selectedRetryRows.value.length > 0 && batch.value?.status !== 'image_generating'
);

const canCutoutSelection = computed(() => selectedCutoutRows.value.length > 0);

function refresh() {
	const id = Number(route.params.id);
	if (!id) {
		return;
	}
	podGenerationService.detail({ id }).then((res: any) => {
		batch.value = res;
		imageCacheKey.value = Date.now();
		Crud.value?.refresh({ page: 1 });
	});
}

function openPrompt(row: any) {
	Form.value?.open({
		title: '编辑提示词',
		width: '760px',
		props: { labelWidth: '100px' },
		items: [
			{ label: 'SEO文件名', prop: 'seoFileName', component: { name: 'el-input' } },
			{ label: 'SEO标题', prop: 'seoTitle', component: { name: 'el-input' } },
			{ label: '标签', prop: 'tags', component: { name: 'el-input' } },
			{
				label: 'Prompt',
				prop: 'prompt',
				required: true,
				component: { name: 'el-input', props: { type: 'textarea', rows: 8 } }
			}
		],
		form: { ...row },
		on: {
			submit(data, { close, done }) {
				podGenerationService
					.updatePrompt(data)
					.then(() => {
						ElMessage.success('已保存');
						close();
						refresh();
					})
					.catch(err => {
						ElMessage.error(err.message);
						done();
					});
			}
		}
	});
}

function approveSelection() {
	approve(selectedDraftRows.value);
}

async function runAction<T>(worker: () => Promise<T>, successMessage: string, fallbackError = '操作失败') {
	if (actionLoading.value) {
		return;
	}
	try {
		actionLoading.value = true;
		await worker();
		ElMessage.success(successMessage);
		refresh();
	} catch (err: any) {
		if (err !== 'cancel') {
			ElMessage.error(err?.message || fallbackError);
		}
	} finally {
		actionLoading.value = false;
	}
}

function approve(rows: any[]) {
	runAction(
		() => podGenerationService.approvePrompts({ ids: rows.map(e => e.id) }),
		'提示词已确认',
		'提示词确认失败'
	);
}

function run() {
	ElMessageBox.confirm('将生成当前批次中已确认且待生成的图片，是否继续？', '提示', {
		type: 'warning'
	}).then(() =>
		runAction(
			() => podGenerationService.runBatch({ id: batch.value.id }),
			'生成完成',
			'生成失败'
		)
	);
}

function retryFailed() {
	ElMessageBox.confirm('确定重试当前批次中的失败图片？', '提示', { type: 'warning' }).then(() =>
		runAction(
			() => podGenerationService.retryFailed({ id: batch.value.id }),
			'重试完成',
			'重试失败'
		)
	);
}

function retryItem(row: any) {
	ElMessageBox.confirm(`将重新生成第 ${row.itemNo || row.id} 张图片，是否继续？`, '提示', {
		type: 'warning'
	}).then(() =>
		runAction(
			() => podGenerationService.retryItem({ id: row.id }),
			'生成完成',
			'生成失败'
		)
	);
}

function retrySelection() {
	const rows = selectedRetryRows.value;
	ElMessageBox.confirm(`将重新生成选中的 ${rows.length} 张图片，是否继续？`, '提示', {
		type: 'warning'
	}).then(() =>
		runAction(
			() => podGenerationService.retryItems({ ids: rows.map(e => e.id) }),
			'重生成完成',
			'重生成失败'
		)
	);
}

function cutoutSelection() {
	const rows = selectedCutoutRows.value;
	ElMessageBox.confirm(
		`将按顺序逐张抠图选中的 ${rows.length} 张图片，完成一张后才会开始下一张，是否继续？`,
		'提示',
		{ type: 'warning' }
	).then(async () => {
		if (actionLoading.value) {
			return;
		}
		let success = 0;
		const failed: string[] = [];
		try {
			actionLoading.value = true;
			for (let index = 0; index < rows.length; index += 1) {
				const row = rows[index];
				ElMessage.info(`正在抠图 ${index + 1}/${rows.length}：${row.itemNo || row.id}`);
				try {
					await podGenerationService.cutoutItem({ id: row.id });
					success += 1;
					refresh();
				} catch (err: any) {
					failed.push(`${row.itemNo || row.id}：${err?.message || '抠图失败'}`);
				}
			}
			if (failed.length) {
				ElMessage.warning(`选中抠图完成，成功 ${success} 张，失败 ${failed.length} 张`);
				console.warn('[POD_CUTOUT_SELECTION_FAIL]', failed);
			} else {
				ElMessage.success(`选中抠图完成，共 ${success} 张`);
			}
			refresh();
		} finally {
			actionLoading.value = false;
		}
	});
}

function cutoutItem(row: any) {
	// 抠图只消费当前已落盘图片；ComfyUI 恢复后可对之前保留的原图继续处理。
	ElMessageBox.confirm('将对当前图片执行抠图，并覆盖为透明背景版本，是否继续？', '提示', {
		type: 'warning'
	}).then(() =>
		runAction(
			() => podGenerationService.cutoutItem({ id: row.id }),
			'抠图完成',
			'抠图失败'
		)
	);
}

function generateMockupItem(row: any) {
	// 单独生成效果图方便修正模板合成结果，重复执行会覆盖同名 JPG。
	ElMessageBox.confirm('将用当前印花图生成并覆盖 T 恤效果图，是否继续？', '提示', {
		type: 'warning'
	}).then(() =>
		runAction(
			() => podGenerationService.generateMockupItem({ id: row.id }),
			'效果图已生成',
			'效果图生成失败'
		)
	);
}

onActivated(() => {
	refresh();
});

onMounted(() => {
	refresh();
});

watch(
	() => route.params.id,
	() => {
		refresh();
	}
);
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
