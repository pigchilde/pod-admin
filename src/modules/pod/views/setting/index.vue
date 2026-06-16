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
					<el-form-item label="图片生成供应商">
						<el-select
							v-model="form.generation.providerId"
							filterable
							placeholder="请选择图片生成供应商"
						>
							<el-option
								v-for="item in imageProviderOptions"
								:key="item.id"
								:label="providerOptionLabel(item)"
								:value="item.id"
							/>
						</el-select>
					</el-form-item>
					<el-form-item label="生图尺寸">
						<el-input v-model="form.generation.size" placeholder="1024x1024" @blur="validateSizeField('size')" />
					</el-form-item>
					<el-form-item label="输出尺寸">
						<el-input v-model="form.generation.outputSize" placeholder="2048x2048" @blur="validateSizeField('outputSize')" />
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
					<el-form-item label="提示词生成供应商">
						<el-select
							v-model="form.prompt.providerId"
							filterable
							placeholder="请选择提示词生成供应商"
						>
							<el-option
								v-for="item in promptProviderOptions"
								:key="item.id"
								:label="providerOptionLabel(item)"
								:value="item.id"
							/>
						</el-select>
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
import { podProviderService } from '../../service/provider';

interface ProviderOption {
	id: number;
	name: string;
	code: string;
	protocol: string;
}

const loading = ref(false);
const saving = ref(false);
const imageProviderOptions = ref<ProviderOption[]>([]);
const promptProviderOptions = ref<ProviderOption[]>([]);

const form = reactive({
	generation: {
		outputDir: '',
		providerId: undefined as number | undefined,
		timeoutMs: 180000,
		size: '1024x1024',
		outputSize: '2048x2048'
	},
	prompt: {
		providerId: undefined as number | undefined,
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
	Object.assign(form.generation, {
		outputDir: data?.generation?.outputDir || '',
		providerId: data?.generation?.providerId,
		timeoutMs: data?.generation?.timeoutMs || 180000,
		size: data?.generation?.size || '1024x1024',
		outputSize: data?.generation?.outputSize || '2048x2048'
	});
	Object.assign(form.prompt, {
		providerId: data?.prompt?.providerId,
		temperature: data?.prompt?.temperature ?? 0.7,
		maxTokens: data?.prompt?.maxTokens || 8192,
		systemPrompt: data?.prompt?.systemPrompt || ''
	});
	Object.assign(form.cutout, data?.cutout || {});
	form.unifiedPrompt = data?.unifiedPrompt || '';
}

function providerOptionLabel(item: ProviderOption) {
	return `${item.name}（${item.code} / ${item.protocol}）`;
}

async function loadProviderOptions() {
	const [imageProviders, promptProviders] = await Promise.all([
		podProviderService.options({ type: 'image' }),
		podProviderService.options({ type: 'prompt' })
	]);
	imageProviderOptions.value = ((imageProviders as any)?.data || imageProviders || []) as ProviderOption[];
	promptProviderOptions.value = ((promptProviders as any)?.data ||
		promptProviders ||
		[]) as ProviderOption[];
}

async function load() {
	loading.value = true;
	try {
		await loadProviderOptions();
		const data = await podSettingService.info();
		setForm(data);
	} finally {
		loading.value = false;
	}
}

function validateSizeField(field: 'size' | 'outputSize') {
	const value = String(form.generation[field] || '').trim();
	if (!/^\d+x\d+$/.test(value)) {
		ElMessage.warning('图片尺寸格式应为 1024x1024');
		form.generation[field] = field === 'size' ? '1024x1024' : '2048x2048';
	}
}

function save() {
	validateSizeField('size');
	validateSizeField('outputSize');
	saving.value = true;
	podSettingService
		.save(form)
		.then((res: any) => {
			setForm(res);
			ElMessage.success('设置已保存');
		})
		.catch((err: any) => {
			ElMessage.error(err?.message || '设置保存失败');
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
