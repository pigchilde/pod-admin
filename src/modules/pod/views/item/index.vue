<template>
	<cl-crud ref="Crud">
		<cl-row>
			<el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
			<cl-refresh-btn />
			<el-button
				type="primary"
				:disabled="!canApproveSelection"
				@click="approveSelection"
			>
				确认提示词
			</el-button>
			<el-button
				type="success"
				:disabled="!canRun"
				@click="run"
			>
				生成待生成
			</el-button>
			<el-button
				type="warning"
				:disabled="!canRetrySelection"
				@click="retrySelection"
			>
				重生成选中
			</el-button>
			<el-button type="warning" :disabled="!batch?.failedCount" @click="retryFailed">
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
						:src="imagePreviewUrl(scope.row.imageUrl, scope.row)"
						:preview-src-list="[imagePreviewUrl(scope.row.imageUrl, scope.row)]"
						preview-teleported
						fit="cover"
						class="preview"
					/>
					<div v-else class="empty">未生成</div>
				</template>

				<template #column-mockupImageUrl="{ scope }">
					<el-image
						v-if="scope.row.mockupImageUrl"
						:src="imagePreviewUrl(scope.row.mockupImageUrl, scope.row)"
						:preview-src-list="[imagePreviewUrl(scope.row.mockupImageUrl, scope.row)]"
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
					<el-tag :type="statusType(scope.row.status)" effect="plain">
						{{ statusText(scope.row.status) }}
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

const route = useRoute();
const router = useRouter();
const Form = useForm();
const batch = ref<any>();

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
						onClick() {
							openPrompt(scope.row);
						}
					},
					{
						label: '确认',
						type: 'success',
						hidden: scope.row.promptStatus === 'approved',
						onClick() {
							approve([scope.row]);
						}
					},
					{
						label: '生图',
						type: 'warning',
						hidden: scope.row.status === 'running',
						onClick() {
							retryItem(scope.row);
						}
					},
					{
						label: '抠图',
						type: 'primary',
						hidden:
							!scope.row.imageUrl ||
							scope.row.status === 'running' ||
							scope.row.promptStatus !== 'approved',
						onClick() {
							cutoutItem(scope.row);
						}
					},
					{
						label: '生成效果图',
						type: 'success',
						hidden: !scope.row.imageUrl || scope.row.status === 'running',
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
	selectedRows.value.filter((row: any) => row.promptStatus === 'approved' && row.status !== 'running')
);

const canApproveSelection = computed(() => selectedDraftRows.value.length > 0);

const canRetrySelection = computed(
	() => selectedRetryRows.value.length > 0 && batch.value?.status !== 'image_generating'
);

function statusText(status: string) {
	return ({ pending: '待生成', running: '生成中', success: '成功', failed: '失败' } as any)[
		status || 'pending'
	];
}

function statusType(status: string) {
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

function imagePreviewUrl(url: string, row: any) {
	if (!url) {
		return '';
	}
	if (url.includes('v=')) {
		return url;
	}
	const version = row.updateTime || row.createTime || Date.now();
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function refresh() {
	const id = Number(route.params.id);
	if (!id) {
		return;
	}
	podGenerationService.detail({ id }).then((res: any) => {
		batch.value = res;
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

function approve(rows: any[]) {
	podGenerationService.approvePrompts({ ids: rows.map(e => e.id) }).then(() => {
		ElMessage.success('提示词已确认');
		refresh();
	});
}

function run() {
	ElMessageBox.confirm('将生成当前批次中已确认且待生成的图片，是否继续？', '提示', {
		type: 'warning'
	}).then(() => {
		podGenerationService.runBatch({ id: batch.value.id }).then(() => {
			ElMessage.success('生成完成');
			refresh();
		});
	});
}

function retryFailed() {
	ElMessageBox.confirm('确定重试当前批次中的失败图片？', '提示', { type: 'warning' }).then(() => {
		podGenerationService.retryFailed({ id: batch.value.id }).then(() => {
			ElMessage.success('重试完成');
			refresh();
		});
	});
}

function retryItem(row: any) {
	podGenerationService.retryItem({ id: row.id }).then(() => {
		ElMessage.success('生成完成');
		refresh();
	});
}

function retrySelection() {
	const rows = selectedRetryRows.value;
	ElMessageBox.confirm(`将重新生成选中的 ${rows.length} 张图片，是否继续？`, '提示', {
		type: 'warning'
	}).then(() => {
		podGenerationService.retryItems({ ids: rows.map(e => e.id) }).then(() => {
			ElMessage.success('重生成完成');
			refresh();
		});
	});
}

function cutoutItem(row: any) {
	ElMessageBox.confirm('将对当前图片执行抠图，并覆盖为透明背景版本，是否继续？', '提示', {
		type: 'warning'
	}).then(() => {
		podGenerationService
			.cutoutItem({ id: row.id })
			.then(() => {
				ElMessage.success('抠图完成');
				refresh();
			})
			.catch(err => {
				ElMessage.error(err.message || '抠图失败');
				refresh();
			});
	});
}

function generateMockupItem(row: any) {
	ElMessageBox.confirm('将用当前印花图生成并覆盖 T 恤效果图，是否继续？', '提示', {
		type: 'warning'
	}).then(() => {
		podGenerationService
			.generateMockupItem({ id: row.id })
			.then(() => {
				ElMessage.success('效果图已生成');
				refresh();
			})
			.catch(err => {
				ElMessage.error(err.message || '效果图生成失败');
			});
	});
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
