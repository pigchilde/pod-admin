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
			<cl-select
				:options="options.processStatus"
				prop="cutoutStatus"
				:width="120"
				placeholder="抠图状态"
			/>
			<cl-select
				:options="options.processStatus"
				prop="mockupStatus"
				:width="130"
				placeholder="效果图状态"
			/>
			<cl-select
				:options="options.verifyStatus"
				prop="verifyStatus"
				:width="120"
				placeholder="检查状态"
			/>
			<el-date-picker
				v-model="createDateRange"
				type="daterange"
				clearable
				range-separator="至"
				start-placeholder="创建开始"
				end-placeholder="创建结束"
				value-format="YYYY-MM-DD"
				:style="{ width: '260px' }"
				@change="refreshByDate"
			/>
			<cl-search-key placeholder="搜索 prompt / 文件名 / 标题" />
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

				<template #column-cutoutStatus="{ scope }">
					<el-tag :type="processStatusType(scope.row.cutoutStatus)" effect="plain">
						{{ processStatusText(scope.row.cutoutStatus) }}
					</el-tag>
				</template>

				<template #column-mockupStatus="{ scope }">
					<el-tag :type="processStatusType(scope.row.mockupStatus)" effect="plain">
						{{ processStatusText(scope.row.mockupStatus) }}
					</el-tag>
				</template>

				<template #column-verifyStatus="{ scope }">
					<el-tag :type="verifyStatusType(scope.row.verifyStatus)" effect="plain">
						{{ verifyStatusText(scope.row.verifyStatus) }}
					</el-tag>
				</template>

				<template #column-filePath="{ scope }">
					<el-tooltip
						v-if="scope.row.filePath"
						:content="fileDirectory(scope.row.filePath)"
						placement="top"
					>
						<el-link type="primary" class="path-link" @click="copyFileDirectory(scope.row.filePath)">
							{{ fileDirectory(scope.row.filePath) }}
						</el-link>
					</el-tooltip>
					<span v-else class="empty-text">未生成</span>
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
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';
import { podGenerationService } from '../../service/generation';
import { imagePreviewUrl, imageStatusText, imageStatusType, promptStatusText, promptStatusType } from '../../utils/display';

const options = reactive({
	status: [
		{ label: '待生成', value: 'pending', type: 'info' },
		{ label: '生成中', value: 'running', type: 'primary' },
		{ label: '成功', value: 'success', type: 'success' },
		{ label: '失败', value: 'failed', type: 'danger' }
	],
	promptStatus: [
		{ label: '待确认', value: 'draft', type: 'warning' },
		{ label: '已确认', value: 'approved', type: 'success' },
		{ label: '已驳回', value: 'rejected', type: 'danger' }
	],
	processStatus: [
		{ label: '待处理', value: 'pending', type: 'info' },
		{ label: '处理中', value: 'running', type: 'primary' },
		{ label: '成功', value: 'success', type: 'success' },
		{ label: '失败', value: 'failed', type: 'danger' },
		{ label: '跳过', value: 'skipped', type: 'info' }
	],
	verifyStatus: [
		{ label: '待检查', value: 'pending', type: 'info' },
		{ label: '通过', value: 'ok', type: 'success' },
		{ label: '警告', value: 'warning', type: 'warning' },
		{ label: '失败', value: 'failed', type: 'danger' }
	]
});

const createDateRange = ref<[string, string] | []>(todayRange());
const imageCacheKey = ref(Date.now());

const itemService = {
	page(data: any) {
		// 图片管理是跨批次视角，默认把最新创建的图片任务放在最前面。
		return podGenerationService.items({
			...data,
			...createTimeParams(),
			order: 'latest'
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
	contextMenu: ['refresh'],
	columns: [
		{ prop: 'imageUrl', label: '图片', width: 120 },
		{ prop: 'mockupImageUrl', label: '效果图', width: 120 },
		{ prop: 'itemNo', label: '编号', width: 80 },
		{ prop: 'status', label: '图片状态', width: 110 },
		{ prop: 'promptStatus', label: '提示词', width: 110 },
		{ prop: 'cutoutStatus', label: '抠图', width: 100 },
		{ prop: 'mockupStatus', label: '效果图', width: 100 },
		{ prop: 'verifyStatus', label: '检查', width: 100 },
		{ prop: 'seoTitle', label: '标题', minWidth: 220, showOverflowTooltip: true },
		{ prop: 'filePath', label: '文件路径', minWidth: 260, showOverflowTooltip: true },
		{ prop: 'createTime', label: '创建时间', width: 170, sortable: 'desc' },
		{
			type: 'op',
			width: 150,
			buttons({ scope }) {
				return [
					{
						label: '生成效果图',
						type: 'success',
						hidden: !scope.row.imageUrl || scope.row.status === 'running' || scope.row.mockupStatus === 'running',
						onClick() {
							generateMockupItem(scope.row);
						}
					}
				];
			}
		}
	]
});


function todayRange(): [string, string] {
	const today = dayjs().format('YYYY-MM-DD');
	return [today, today];
}

function createTimeParams() {
	const [start, end] = createDateRange.value || [];
	return {
		createTimeStart: start ? `${start} 00:00:00` : '',
		createTimeEnd: end ? `${end} 23:59:59` : ''
	};
}

function refreshByDate() {
	refresh({ page: 1 });
}

function refresh(params?: any) {
	imageCacheKey.value = Date.now();
	Crud.value?.refresh(params);
}

function fileDirectory(filePath: string) {
	// 图片管理复制批次目录：先去掉文件名，再去掉 images/tshirt-effects 这类产物子目录。
	const text = String(filePath || '').trim();
	const index = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
	const directory = index > 0 ? text.slice(0, index) : text;
	const separator = directory.includes('\\') ? '\\' : '/';
	const parts = directory.split(/[\\/]+/);
	const last = parts[parts.length - 1];

	if (['images', 'tshirt-effects'].includes(last)) {
		return directory.slice(0, directory.lastIndexOf(separator) + 1);
	}

	return directory.endsWith(separator) ? directory : `${directory}${separator}`;
}

function copyFileDirectory(filePath: string) {
	const directory = fileDirectory(filePath);
	if (!directory) {
		ElMessage.warning('暂无可复制的文件路径');
		return;
	}

	copyText(directory)
		.then(() => {
			ElMessage.success('文件路径已复制');
		})
		.catch(() => {
			ElMessage.error('复制失败，请手动复制');
		});
}

async function copyText(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', 'readonly');
	textarea.style.position = 'fixed';
	textarea.style.left = '-9999px';
	document.body.appendChild(textarea);
	textarea.select();
	const success = document.execCommand('copy');
	document.body.removeChild(textarea);
	if (!success) {
		throw new Error('copy failed');
	}
}

function generateMockupItem(row: any) {
	// 只基于当前印花图重新合成 T 恤效果图，不触发生图或抠图。
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

function processStatusText(status: string) {
	return (
		{
			pending: '待处理',
			running: '处理中',
			success: '成功',
			failed: '失败',
			skipped: '跳过'
		} as Record<string, string>
	)[status || 'pending'];
}

function processStatusType(status: string) {
	return (
		{
			pending: 'info',
			running: 'primary',
			success: 'success',
			failed: 'danger',
			skipped: 'info'
		} as Record<string, any>
	)[status || 'pending'];
}

function verifyStatusText(status: string) {
	return (
		{
			pending: '待检查',
			ok: '通过',
			warning: '警告',
			failed: '失败'
		} as Record<string, string>
	)[status || 'pending'];
}

function verifyStatusType(status: string) {
	return (
		{
			pending: 'info',
			ok: 'success',
			warning: 'warning',
			failed: 'danger'
		} as Record<string, any>
	)[status || 'pending'];
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

.empty-text {
	color: var(--el-text-color-secondary);
}

.path-link {
	max-width: 100%;

	:deep(.el-link__inner) {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
