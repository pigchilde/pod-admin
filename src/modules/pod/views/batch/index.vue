<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />

			<el-button type="primary" :icon="Plus" @click="openCreate">创建批次</el-button>

			<cl-flex1 />

			<cl-select
				:options="options.status"
				prop="status"
				:width="140"
				placeholder="批次状态"
			/>
			<cl-search-key placeholder="搜索主题 / 批次号" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-status="{ scope }">
					<el-tag :type="statusType(scope.row.status)" effect="plain">
						{{ statusText(scope.row.status) }}
					</el-tag>
				</template>

				<template #column-promptProgress="{ scope }">
					{{ scope.row.approvedPromptCount || 0 }} / {{ scope.row.promptCount || scope.row.count }}
				</template>

				<template #column-imageProgress="{ scope }">
					<span>{{ scope.row.successCount || 0 }} / {{ scope.row.count }}</span>
					<el-text v-if="scope.row.failedCount" type="danger" class="failed">
						失败 {{ scope.row.failedCount }}
					</el-text>
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
	name: 'pod-generation'
});

import { useCrud, useForm, useTable } from '@cool-vue/crud';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { podGenerationService } from '../../service/generation';

const router = useRouter();
const Form = useForm();

const options = reactive({
	status: [
		{ label: '生成提示词', value: 'prompt_generating', type: 'primary' },
		{ label: '待确认', value: 'prompt_ready', type: 'warning' },
		{ label: '生成图片', value: 'image_generating', type: 'primary' },
		{ label: '已完成', value: 'completed', type: 'success' },
		{ label: '部分失败', value: 'partial_failed', type: 'warning' },
		{ label: '失败', value: 'failed', type: 'danger' }
	]
});

const Crud = useCrud(
	{
		service: podGenerationService
	},
	app => {
		app.refresh();
	}
);

const Table = useTable({
	contextMenu: ['refresh'],
	columns: [
		{ prop: 'batchNo', label: '批次号', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'topic', label: '主题', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'status', label: '状态', width: 130 },
		{ prop: 'promptProgress', label: '提示词', width: 120 },
		{ prop: 'imageProgress', label: '图片', width: 160 },
		{ prop: 'concurrency', label: '并发', width: 80 },
		{ prop: 'retries', label: '重试', width: 80 },
		{ prop: 'createTime', label: '创建时间', width: 170, sortable: 'desc' },
		{
			type: 'op',
			width: 200,
			buttons: [
				{
					label: '详情',
					type: 'primary',
					onClick({ scope }) {
						goDetail(scope.row);
					}
				},
				{
					label: '删除',
					type: 'danger',
					onClick({ scope }) {
						removeBatch(scope.row);
					}
				}
			]
		}
	]
});

function statusText(status: string) {
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

function statusType(status: string) {
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

function openCreate() {
	Form.value?.open({
		title: '创建批量生图',
		width: '560px',
		props: {
			labelWidth: '100px'
		},
		items: [
			{
				label: '主题',
				prop: 'topic',
				required: true,
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 4,
						placeholder: '例如：搞笑猫咪复古西部风 T 恤印花'
					}
				}
			},
			{
				label: '数量',
				prop: 'count',
				value: 10,
				component: {
					name: 'el-input-number',
					props: { min: 1, max: 100 }
				}
			},
			{
				label: '并发数',
				prop: 'concurrency',
				value: 3,
				component: {
					name: 'el-input-number',
					props: { min: 1, max: 10 }
				}
			},
			{
				label: '失败重试',
				prop: 'retries',
				value: 1,
				component: {
					name: 'el-input-number',
					props: { min: 0, max: 5 }
				}
			}
		],
		on: {
			submit(data, { close, done }) {
				podGenerationService
					.createBatch(data)
					.then((res: any) => {
						ElMessage.success('批次已创建，提示词已生成');
						done();
						close();
						Form.value?.close();
						Crud.value?.refresh();
						if (res?.id) {
							setTimeout(() => goDetail(res), 0);
						}
					})
					.catch(err => {
						ElMessage.error(err.message);
						done();
					});
			}
		}
	});
}

function goDetail(row: any) {
	router.push(`/pod/generation/detail/${row.id}`);
}

function removeBatch(row: any) {
	ElMessageBox.confirm(`将删除批次「${row.batchNo}」及其所有图片记录，是否继续？`, '提示', {
		type: 'warning'
	})
		.then(() => {
			podGenerationService
				.delete({ ids: [row.id] })
				.then(() => {
					ElMessage.success('批次已删除');
					Crud.value?.refresh();
				})
				.catch(err => {
					ElMessage.error(err.message);
				});
		})
		.catch(() => null);
}
</script>

<style lang="scss" scoped>
.failed {
	margin-left: 8px;
}
</style>
