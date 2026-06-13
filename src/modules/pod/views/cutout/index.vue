<template>
	<div class="pod-cutout">
		<div class="toolbar">
			<el-upload
				ref="UploadRef"
				v-model:file-list="fileList"
				:auto-upload="false"
				:multiple="true"
				:limit="50"
				accept="image/png,image/jpeg,image/webp"
				:on-exceed="onExceed"
				:on-change="onChange"
				:on-remove="onChange"
				drag
			>
				<el-icon class="toolbar__icon"><UploadFilled /></el-icon>
				<div class="toolbar__text">点击或拖拽图片到这里</div>
				<template #tip>
					<div class="toolbar__tip">支持 png、jpg、jpeg、webp，抠图结果保存到 generated/cutout/日期</div>
				</template>
			</el-upload>

			<div class="toolbar__actions">
				<el-button :icon="Delete" :disabled="loading || !fileList.length" @click="clearFiles">
					清空
				</el-button>
				<el-button
					type="primary"
					:icon="Scissor"
					:loading="loading"
					:disabled="!fileList.length"
					@click="submit"
				>
					开始抠图
				</el-button>
			</div>
		</div>

		<div v-if="summary.total" class="summary">
			<el-statistic title="上传数量" :value="summary.total" />
			<el-statistic title="成功" :value="summary.success" />
			<el-statistic title="失败" :value="summary.failed" />
			<div class="summary__dir">
				<span>输出目录</span>
				<code>{{ summary.outputDir }}</code>
			</div>
		</div>

		<div v-if="results.length" class="result-grid">
			<div
				v-for="item in results"
				:key="`${item.originalName}-${item.fileName || item.error}`"
				class="result-card"
				:class="{ 'is-error': !item.success }"
			>
				<div class="result-card__preview">
					<el-image v-if="item.success" :src="item.imageUrl" fit="contain" lazy />
					<el-icon v-else><WarningFilled /></el-icon>
				</div>
				<div class="result-card__body">
					<div class="result-card__name" :title="item.originalName">{{ item.originalName }}</div>
					<template v-if="item.success">
						<el-tag type="success" effect="plain">已完成</el-tag>
						<div class="result-card__path" :title="item.imageUrl">{{ item.imageUrl }}</div>
						<el-button link type="primary" :icon="View" @click="openImage(item.imageUrl)">
							查看图片
						</el-button>
					</template>
					<template v-else>
						<el-tag type="danger" effect="plain">失败</el-tag>
						<div class="result-card__error">{{ item.error }}</div>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-cutout'
});

import { Delete, Scissor, UploadFilled, View, WarningFilled } from '@element-plus/icons-vue';
import type { UploadFile, UploadFiles, UploadInstance, UploadUserFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { podCutoutService } from '../../service/cutout';

interface CutoutResult {
	originalName: string;
	fileName?: string;
	filePath?: string;
	imageUrl?: string;
	success: boolean;
	error?: string;
}

const UploadRef = ref<UploadInstance>();
const fileList = ref<UploadUserFile[]>([]);
const loading = ref(false);
const results = ref<CutoutResult[]>([]);
const summary = reactive({
	total: 0,
	success: 0,
	failed: 0,
	outputDir: ''
});

function onExceed() {
	ElMessage.warning('一次最多上传 50 张图片');
}

function onChange(_: UploadFile, files: UploadFiles) {
	fileList.value = files;
}

function clearFiles() {
	UploadRef.value?.clearFiles();
	fileList.value = [];
}

async function submit() {
	const files = fileList.value
		.map(item => item.raw)
		.filter((file): file is NonNullable<UploadUserFile['raw']> => Boolean(file));

	if (!files.length) {
		ElMessage.warning('请先选择图片');
		return;
	}

	loading.value = true;
	try {
		const data = new FormData();
		files.forEach(file => data.append('files', file, file.name));
		const res: any = await podCutoutService.upload(data);

		summary.total = res.total || 0;
		summary.success = res.success || 0;
		summary.failed = res.failed || 0;
		summary.outputDir = res.outputDir || '';
		results.value = res.results || [];

		if (summary.failed) {
			ElMessage.warning(`抠图完成，${summary.failed} 张失败`);
		} else {
			ElMessage.success('抠图完成');
		}
	} finally {
		loading.value = false;
	}
}

function openImage(url?: string) {
	if (url) {
		window.open(url, '_blank');
	}
}
</script>

<style lang="scss" scoped>
.pod-cutout {
	padding: 12px;

	.toolbar {
		background-color: var(--el-bg-color);
		border: 1px solid var(--el-border-color-light);
		border-radius: 8px;
		padding: 16px;

		:deep(.el-upload) {
			width: 100%;
		}

		:deep(.el-upload-dragger) {
			width: 100%;
			padding: 28px 16px;
		}

		&__icon {
			color: var(--el-color-primary);
			font-size: 34px;
		}

		&__text {
			color: var(--el-text-color-primary);
			font-size: 15px;
			margin-top: 8px;
		}

		&__tip {
			color: var(--el-text-color-secondary);
			font-size: 13px;
			margin-top: 8px;
		}

		&__actions {
			display: flex;
			justify-content: flex-end;
			gap: 10px;
			margin-top: 14px;
		}
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(3, minmax(120px, 1fr)) minmax(280px, 2fr);
		gap: 12px;
		margin-top: 12px;

		:deep(.el-statistic),
		&__dir {
			background-color: var(--el-bg-color);
			border: 1px solid var(--el-border-color-light);
			border-radius: 8px;
			padding: 14px;
		}

		&__dir {
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-width: 0;

			span {
				color: var(--el-text-color-secondary);
				font-size: 13px;
				margin-bottom: 6px;
			}

			code {
				color: var(--el-text-color-primary);
				font-size: 13px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.result-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 12px;
		margin-top: 12px;
	}

	.result-card {
		background-color: var(--el-bg-color);
		border: 1px solid var(--el-border-color-light);
		border-radius: 8px;
		overflow: hidden;

		&.is-error {
			border-color: var(--el-color-danger-light-7);
		}

		&__preview {
			align-items: center;
			background:
				linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
				linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
				linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
				linear-gradient(-45deg, transparent 75%, #f3f4f6 75%);
			background-color: #fff;
			background-position:
				0 0,
				0 8px,
				8px -8px,
				-8px 0;
			background-size: 16px 16px;
			display: flex;
			height: 180px;
			justify-content: center;

			:deep(.el-image) {
				height: 100%;
				width: 100%;
			}

			.el-icon {
				color: var(--el-color-danger);
				font-size: 34px;
			}
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 12px;
		}

		&__name {
			color: var(--el-text-color-primary);
			font-weight: 600;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__path,
		&__error {
			color: var(--el-text-color-secondary);
			font-size: 13px;
			line-height: 1.5;
			word-break: break-all;
		}

		&__error {
			color: var(--el-color-danger);
		}
	}
}

@media (max-width: 900px) {
	.pod-cutout {
		.summary {
			grid-template-columns: 1fr;
		}

		.toolbar__actions {
			flex-direction: column;

			.el-button {
				width: 100%;
			}
		}
	}
}
</style>
