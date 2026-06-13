<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />

			<cl-flex1 />

			<cl-select :options="options.type" prop="type" :width="150" placeholder="供应商类型" />
			<cl-select :options="options.enabled" prop="enabled" :width="120" placeholder="状态" />
			<cl-search-key placeholder="搜索名称 / 标识 / 模型" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-type="{ scope }">
					<el-tag :type="scope.row.type === 'image' ? 'primary' : 'success'" effect="plain">
						{{ providerTypeText(scope.row.type) }}
					</el-tag>
				</template>

				<template #column-enabled="{ scope }">
					<el-tag :type="scope.row.enabled ? 'success' : 'info'" effect="plain">
						{{ scope.row.enabled ? '启用' : '停用' }}
					</el-tag>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'pod-provider'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { reactive } from 'vue';
import { podProviderService } from '../../service/provider';

const options = reactive({
	type: [
		{ label: '图片生成', value: 'image' },
		{ label: '提示词生成', value: 'prompt' }
	],
	enabled: [
		{ label: '启用', value: true },
		{ label: '停用', value: false }
	],
	imageProtocols: [
		{ label: 'OpenAI Images', value: 'openai-images' },
		{ label: 'Mock', value: 'mock' }
	],
	promptProtocols: [
		{ label: 'OpenAI Chat Completions', value: 'openai-chat' },
		{ label: 'Anthropic Messages', value: 'anthropic-messages' }
	]
});

const Crud = useCrud(
	{
		service: podProviderService
	},
	app => {
		app.refresh();
	}
);

const Table = useTable({
	contextMenu: ['refresh', 'edit', 'delete'],
	columns: [
		{ type: 'selection' },
		{ prop: 'id', label: 'ID', width: 90 },
		{ prop: 'name', label: '名称', minWidth: 150, showOverflowTooltip: true },
		{ prop: 'code', label: '标识', minWidth: 130, showOverflowTooltip: true },
		{ prop: 'type', label: '类型', width: 110 },
		{ prop: 'protocol', label: '协议', width: 180, showOverflowTooltip: true },
		{ prop: 'model', label: '模型', minWidth: 160, showOverflowTooltip: true },
		{ prop: 'endpoint', label: '接口地址', minWidth: 240, showOverflowTooltip: true },
		{ prop: 'concurrency', label: '默认并发', width: 100 },
		{ prop: 'enabled', label: '状态', width: 90 },
		{ prop: 'orderNum', label: '排序', width: 80 },
		{ type: 'op', width: 160, buttons: ['edit', 'delete'] }
	]
});

const Upsert = useUpsert({
	dialog: {
		width: '760px'
	},
	props: {
		labelWidth: '120px'
	},
	items: [
		{
			label: '供应商名称',
			prop: 'name',
			required: true,
			component: { name: 'el-input', props: { maxlength: 80 } }
		},
		{
			label: '供应商标识',
			prop: 'code',
			required: true,
			component: {
				name: 'el-input',
				props: { maxlength: 60, placeholder: 'rightcodes / deepseek / claude' }
			}
		},
		{
			label: '供应商类型',
			prop: 'type',
			value: 'image',
			required: true,
			component: {
				name: 'el-radio-group',
				options: options.type
			}
		},
		{
			label: '协议',
			prop: 'protocol',
			value: 'openai-images',
			required: true,
			component: {
				name: 'el-select',
				options: [...options.imageProtocols, ...options.promptProtocols]
			}
		},
		{
			label: '接口地址',
			prop: 'endpoint',
			component: {
				name: 'el-input',
				props: { placeholder: 'https://api.example.com/v1/...' }
			}
		},
		{
			label: 'API Key',
			prop: 'apiKey',
			component: {
				name: 'el-input',
				props: {
					placeholder: '编辑时留空表示保留原 Key'
				}
			}
		},
		{
			label: '模型',
			prop: 'model',
			component: {
				name: 'el-input',
				props: { placeholder: 'gpt-image-2 / deepseek-v4-pro' }
			}
		},
		{
			label: '默认并发数',
			prop: 'concurrency',
			value: 3,
			component: {
				name: 'el-input-number',
				props: { min: 1, max: 100 }
			}
		},
		{
			label: '启用',
			prop: 'enabled',
			value: true,
			component: { name: 'el-switch' }
		},
		{
			label: '排序',
			prop: 'orderNum',
			value: 0,
			component: { name: 'el-input-number', props: { min: 0 } }
		},
		{
			label: '备注',
			prop: 'remark',
			component: {
				name: 'el-input',
				props: { type: 'textarea', rows: 3 }
			}
		}
	]
});

function providerTypeText(type: string) {
	return type === 'prompt' ? '提示词生成' : '图片生成';
}
</script>
