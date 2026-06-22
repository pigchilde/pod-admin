<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />

			<el-button type="primary" :icon="Plus" @click="openCreate">创建批次</el-button>
			<cl-import-btn
				type="success"
				:icon="Upload"
				:tips="importTips"
				:row-filter="isImportRowValid"
				first-sheet-only
				:on-submit="onImportSubmit"
			/>
			<el-date-picker
				v-model="exportDateRange"
				type="daterange"
				value-format="YYYY-MM-DD"
				start-placeholder="开始日期"
				end-placeholder="结束日期"
				:clearable="true"
			/>
			<el-button
				type="success"
				:icon="Download"
				:loading="exporting"
				@click="exportBatchExcel"
			>
				导出
			</el-button>

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
					{{ scope.row.approvedPromptCount || 0 }} /
					{{ scope.row.promptCount || scope.row.count }}
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
import { Download, Plus, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { podGenerationService } from '../../service/generation';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const router = useRouter();
const Form = useForm();
const importTips =
	'请上传包含「主题」「数量」两列的 Excel；可选「自动生图」，自动生图支持 是/否、true/false、1/0；生图并发统一使用当前图片供应商配置';
const exportDateRange = ref<string[]>([]);
const exporting = ref(false);

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
		{ prop: 'id', label: 'ID', width: 90 },
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
				label: '失败重试',
				prop: 'retries',
				value: 1,
				component: {
					name: 'el-input-number',
					props: { min: 0, max: 5 }
				}
			},
			{
				label: '自动生图',
				prop: 'autoRun',
				value: true,
				component: {
					name: 'el-switch',
					props: {
						activeText: '提示词生成后直接生图',
						inactiveText: '先审批提示词'
					}
				}
			}
		],
		on: {
			submit(data, { close, done }) {
				// 可按批次决定是否跳过人工审批，直接进入图片生成队列。
				podGenerationService
					.createBatch(data)
					.then((res: any) => {
						ElMessage.success(
							data.autoRun === false
								? '批次已创建，提示词已生成'
								: '批次已创建，正在生成图片'
						);
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

function onImportSubmit(data: { list: any[]; filename?: string }, { done, close }: any) {
	const rows = (data.list || []).filter(isImportRowValid);

	if (!rows.length) {
		done();
		return ElMessage.error('表格中没有可创建的主题和数量');
	}

	const totalImages = rows.reduce((sum, row) => sum + Number(row?.数量 || row?.count || row?.生成数量 || 0), 0);
	const message = `将保存 ${rows.length} 行导入记录，并按行号顺序自动生成提示词和图片，预计 ${totalImages} 张图片。是否继续？`;

	ElMessageBox.confirm(message, '导入确认', { type: 'warning' })
		.then(() =>
			podGenerationService.createBatches({
				rows,
				fileName: data.filename
			})
		)
		.then((res: any) => {
			const failed = res?.failed || 0;
			const queued = res?.queued || 0;
			const importText = res?.importNo ? `，导入编号 ${res.importNo}` : '';
			if (failed) {
				ElMessage.warning(`已保存 ${queued} 行并进入执行队列，${failed} 行格式校验失败${importText}`);
				const details = (res?.results || [])
					.filter((item: any) => item.status === 'failed')
					.map((item: any) => `第 ${item.rowNo} 行：${item.error}`)
					.join('\n');
				ElMessageBox.alert(details, '导入失败明细', {
					type: 'warning'
				});
			} else {
				ElMessage.success(`已保存 ${queued} 行并进入自动执行队列${importText}`);
			}
			close();
			Crud.value?.refresh();
		})
		.catch(err => {
			if (err !== 'cancel') {
				ElMessage.error(err.message || '导入失败');
			}
		})
		.finally(() => {
			done();
		});
}

function isImportRowValid(row: any) {
	const topic = String(row?.主题 || row?.topic || row?.生成主题 || '').trim();
	const count = String(row?.数量 || row?.count || row?.生成数量 || '').trim();
	return Boolean(topic && count);
}

async function exportBatchExcel() {
	try {
		exporting.value = true;
		const [start, end] = exportDateRange.value || [];
		const res: any = await podGenerationService.exportBatches({
			createTimeStart: start ? `${start} 00:00:00` : '',
			createTimeEnd: end ? `${end} 23:59:59` : ''
		});
		const batches = res?.batches || [];
		const items = res?.items || [];

		if (!batches.length) {
			return ElMessage.warning('当前日期范围内没有可导出的批次');
		}

		const batchMap = new Map(batches.map((item: any) => [item.id, item]));
		const mainRows = batches.map((item: any) => ({
			主题: item.topic,
			数量: item.count
		}));
		const detailRows = items.map((item: any) => {
			const batch: any = batchMap.get(item.batchId) || {};
			return {
				'批次 ID': item.batchId,
				主题: batch.topic || '',
				标题: item.seoTitle || item.seoFileName || '',
				Prompt: item.prompt || ''
			};
		});

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			workbook,
			XLSX.utils.json_to_sheet(mainRows, {
				header: ['主题', '数量']
			}),
			'主表'
		);
		XLSX.utils.book_append_sheet(
			workbook,
			XLSX.utils.json_to_sheet(detailRows, {
				header: ['批次 ID', '主题', '标题', 'Prompt']
			}),
			'附表'
		);

		const buffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});
		const rangeText = start && end ? `${start}_${end}` : dayjs().format('YYYY-MM-DD');
		saveAs(
			new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			}),
			`POD批次导出_${rangeText}.xlsx`
		);
		ElMessage.success('导出成功');
	} catch (err: any) {
		ElMessage.error(err.message);
	} finally {
		exporting.value = false;
	}
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
