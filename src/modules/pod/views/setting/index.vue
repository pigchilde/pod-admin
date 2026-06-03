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
					<el-form-item label="生图尺寸">
						<el-input v-model="form.generation.size" placeholder="1024x1024" />
					</el-form-item>
					<el-form-item label="输出尺寸">
						<el-input v-model="form.generation.outputSize" placeholder="2048x2048" />
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
				<div class="preset-actions">
					<el-button size="small" @click="applyPromptPreset('gpt')">套用 GPT 中转站</el-button>
					<el-button size="small" @click="applyPromptPreset('claude')">套用 Claude 中转站</el-button>
				</div>
				<div class="grid">
					<el-form-item label="Provider">
						<el-select v-model="form.prompt.provider" filterable allow-create>
							<el-option label="GPT" value="gpt" />
							<el-option label="Claude" value="claude" />
							<el-option label="DeepSeek" value="deepseek" />
							<el-option label="自定义" value="custom" />
						</el-select>
					</el-form-item>
					<el-form-item label="协议类型">
						<el-select v-model="form.prompt.protocol">
							<el-option label="OpenAI Chat Completions" value="openai-chat" />
							<el-option label="Anthropic Messages" value="anthropic-messages" />
						</el-select>
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
					<el-form-item label="Temperature">
						<el-input-number
							v-model="form.prompt.temperature"
							:min="0"
							:max="2"
							:step="0.1"
							:precision="1"
						/>
					</el-form-item>
					<el-form-item label="Max Tokens">
						<el-input-number
							v-model="form.prompt.maxTokens"
							:min="1024"
							:max="64000"
							:step="1024"
						/>
					</el-form-item>
				</div>
				<el-form-item label="System Prompt">
					<el-input
						v-model="form.prompt.systemPrompt"
						type="textarea"
						:rows="5"
						placeholder="用于约束提示词模型生成内容时的系统角色指令。"
					/>
				</el-form-item>
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

			<div class="section">
				<div class="section__title">ComfyUI 抠图配置</div>
				<div class="grid">
					<el-form-item label="启用抠图">
						<el-switch v-model="form.cutout.enabled" />
					</el-form-item>
					<el-form-item label="ComfyUI 地址">
						<el-input v-model="form.cutout.endpoint" placeholder="http://127.0.0.1:8000" />
					</el-form-item>
					<el-form-item label="抠图模型">
						<el-input v-model="form.cutout.model" placeholder="RMBG-2.0" />
					</el-form-item>
					<el-form-item label="抠图超时时间(ms)">
						<el-input-number
							v-model="form.cutout.timeoutMs"
							:min="30000"
							:max="600000"
							:step="10000"
						/>
					</el-form-item>
					<el-form-item label="黑色容差">
						<el-input-number
							v-model="form.cutout.blackThreshold"
							:min="0"
							:max="255"
							:step="1"
						/>
					</el-form-item>
					<el-form-item label="处理分辨率">
						<el-input-number
							v-model="form.cutout.processRes"
							:min="256"
							:max="2048"
							:step="8"
						/>
					</el-form-item>
					<el-form-item label="遮罩模糊">
						<el-input-number
							v-model="form.cutout.maskBlur"
							:min="0"
							:max="64"
							:step="1"
						/>
					</el-form-item>
					<el-form-item label="主体遮罩偏移">
						<el-input-number
							v-model="form.cutout.subjectMaskOffset"
							:min="-64"
							:max="64"
							:step="1"
						/>
					</el-form-item>
				</div>
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
		size: '1024x1024',
		outputSize: '2048x2048'
	},
	prompt: {
		provider: '',
		protocol: 'openai-chat',
		endpoint: '',
		apiKey: '',
		model: '',
		temperature: 0.7,
		maxTokens: 8192,
		systemPrompt: ''
	},
	cutout: {
		enabled: true,
		endpoint: 'http://127.0.0.1:8000',
		model: 'RMBG-2.0',
		timeoutMs: 180000,
		blackThreshold: 34,
		processRes: 1536,
		maskBlur: 1,
		subjectMaskOffset: -1
	},
	unifiedPrompt: ''
});

function setForm(data: any) {
	Object.assign(form.generation, data?.generation || {});
	Object.assign(form.prompt, data?.prompt || {});
	Object.assign(form.cutout, data?.cutout || {});
	form.unifiedPrompt = data?.unifiedPrompt || '';
}

function applyPromptPreset(type: 'gpt' | 'claude') {
	if (type === 'gpt') {
		Object.assign(form.prompt, {
			provider: 'gpt',
			protocol: 'openai-chat',
			endpoint: 'https://api.avemujica.moe/v1/chat/completions',
			model: 'gpt-5.5',
			temperature: 0.7
		});
		return;
	}

	Object.assign(form.prompt, {
		provider: 'claude',
		protocol: 'anthropic-messages',
		endpoint: 'https://api.avemujica.moe/v1/messages',
		model: 'claude-opus-4-8',
		maxTokens: 8192
	});
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
	box-sizing: border-box;
	height: 100%;
	padding: 16px;
	overflow-y: auto;

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

.preset-actions {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;
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
	padding-bottom: 16px;
}

@media (max-width: 900px) {
	.grid {
		grid-template-columns: 1fr;
	}
}
</style>
