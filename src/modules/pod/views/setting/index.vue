<template>
	<div class="pod-setting">
		<el-form
			v-loading="loading"
			:model="form"
			label-position="top"
			class="pod-setting__form"
		>
			<div class="section">
				<div class="section__title">图片生成配置</div>
				<div class="grid">
					<el-form-item label="输出目录">
						<el-input v-model="form.generation.outputDir" placeholder="../generated/temu-tshirt" />
					</el-form-item>
					<el-form-item label="Provider">
						<el-input v-model="form.generation.provider" placeholder="rightcodes" />
					</el-form-item>
					<el-form-item label="接口地址">
						<el-input v-model="form.generation.endpoint" />
					</el-form-item>
					<el-form-item label="API Key">
						<el-input v-model="form.generation.apiKey" show-password />
					</el-form-item>
					<el-form-item label="图片模型">
						<el-input v-model="form.generation.model" placeholder="gpt-image-2" />
					</el-form-item>
					<el-form-item label="图片尺寸">
						<el-input v-model="form.generation.size" placeholder="2048x2048" />
					</el-form-item>
					<el-form-item label="超时时间(ms)">
						<el-input-number
							v-model="form.generation.timeoutMs"
							:min="30000"
							:max="600000"
							:step="10000"
						/>
					</el-form-item>
				</div>
			</div>

			<div class="section">
				<div class="section__title">提示词生成配置</div>
				<div class="grid">
					<el-form-item label="Provider">
						<el-input v-model="form.prompt.provider" placeholder="deepseek" />
					</el-form-item>
					<el-form-item label="接口地址">
						<el-input v-model="form.prompt.endpoint" />
					</el-form-item>
					<el-form-item label="API Key">
						<el-input v-model="form.prompt.apiKey" show-password />
					</el-form-item>
					<el-form-item label="提示词模型">
						<el-input v-model="form.prompt.model" placeholder="deepseek-v4-pro" />
					</el-form-item>
				</div>
			</div>

			<div class="section">
				<div class="section__title">模块统一提示词</div>
				<el-form-item>
					<el-input
						v-model="form.unifiedPrompt"
						type="textarea"
						:rows="8"
						placeholder="这里填写的内容会在每次生成图片时追加到每条图片 Prompt 后面。"
					/>
				</el-form-item>
			</div>

			<div class="actions">
				<el-button @click="load">刷新</el-button>
				<el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
			</div>
		</el-form>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-setting'
});

import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { podSettingService } from '../../service/setting';

const loading = ref(false);
const saving = ref(false);

const form = reactive({
	generation: {
		outputDir: '',
		provider: '',
		timeoutMs: 180000,
		endpoint: '',
		apiKey: '',
		model: '',
		size: '2048x2048'
	},
	prompt: {
		provider: '',
		endpoint: '',
		apiKey: '',
		model: ''
	},
	unifiedPrompt: ''
});

function setForm(data: any) {
	Object.assign(form.generation, data?.generation || {});
	Object.assign(form.prompt, data?.prompt || {});
	form.unifiedPrompt = data?.unifiedPrompt || '';
}

function load() {
	loading.value = true;
	podSettingService
		.info()
		.then(setForm)
		.finally(() => {
			loading.value = false;
		});
}

function save() {
	saving.value = true;
	podSettingService
		.save(form)
		.then((res: any) => {
			setForm(res);
			ElMessage.success('设置已保存');
		})
		.finally(() => {
			saving.value = false;
		});
}

onMounted(() => {
	load();
});
</script>

<style lang="scss" scoped>
.pod-setting {
	padding: 16px;

	&__form {
		max-width: 1180px;
	}
}

.section {
	margin-bottom: 18px;
	padding: 18px;
	border: 1px solid var(--el-border-color-light);
	border-radius: 8px;
	background-color: var(--el-bg-color);

	&__title {
		margin-bottom: 16px;
		font-size: 16px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}
}

.grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 4px 18px;
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	max-width: 1180px;
}

@media (max-width: 900px) {
	.grid {
		grid-template-columns: 1fr;
	}
}
</style>
