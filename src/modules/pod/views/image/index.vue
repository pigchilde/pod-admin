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

const createDateRange = ref<[string, string] | []>(todayRange());

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

function imagePreviewUrl(url: string, row: any) {
	// 效果图会覆盖同名 JPG，展示时带版本参数避免浏览器继续使用旧缓存。
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

function todayRange(): [string, string] {
	const today = dayjs().format('YYYY-MM-DD');
	return [today, today];
}

function createTimeParams() {
	const [startDate, endDate] = createDateRange.value || [];
	if (!startDate || !endDate) {
		return {};
	}
	return {
		createTimeStart: `${startDate} 00:00:00`,
		createTimeEnd: `${endDate} 23:59:59`
	};
}

function refreshByDate() {
	// 日期范围只影响图片管理列表，清空日期后可查看全部历史图片。
	Crud.value?.refresh({ page: 1 });
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
				Crud.value?.refresh();
			})
			.catch(err => {
				ElMessage.error(err.message || '效果图生成失败');
			});
	});
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
