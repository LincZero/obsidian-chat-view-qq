import { App, PluginSettingTab, Setting } from "obsidian"; // 新增
import ChatViewPlugin from "./main"

// 设置内容的接口
export interface ChatPluginSettings {
	chatSelfName: string,
	chatQQandName: string,
	width: string,
	maxHeight: string,
	isShowTime: boolean, // false的好处是渲染更真实、更简洁，true的好处是信息更多
	isRenderMd: boolean,
	isPcStyle: boolean,
}

// 设置内容的默认值，这是一个类似枚举的东西
export const DEFAULT_SETTINGS: ChatPluginSettings = {
	chatSelfName: '我, me, Q, user',
	chatQQandName: '',
	width: '100%',
	maxHeight: '1100',
	isShowTime: false,
	isRenderMd: true,
	isPcStyle: true,
}

// 设置内容
export class ChatSettingTab extends PluginSettingTab {
	plugin: ChatViewPlugin;

	constructor(app: App, plugin: ChatViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		// 一个h2标题
		containerEl.createEl('h2', {text: 'Chat-qq 相关设置'});

		// 创建一个新的设置项
		new Setting(containerEl)
		.setName('默认渲染宽度')
		.setDesc('【重启插件生效】用于渲染记录，不填单位为px')
		.addText(text => text
			.setPlaceholder("例如：900")
			.setValue(String(this.plugin.settings.width))
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.width = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('默认渲染最大高度')
		.setDesc('【重启插件生效】用于渲染记录，超过后会变成滚动框，不填单位为px')
		.addText(text => text
			.setPlaceholder("例如：1100")
			.setValue(String(this.plugin.settings.maxHeight))
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.maxHeight = value;
				await this.plugin.saveSettings();
			}));
		
		new Setting(containerEl)
			.setName('自己的昵称')											 // 设置项名字
			.setDesc('自己的对话框将从右侧弹出，己方有多个昵称时用逗号隔开')					 // 设置项提示
			.addText(text => text												// 输入框
				.setPlaceholder('例如：我, 吾, 朕, me, user')				// 没有内容时的提示
				.setValue(this.plugin.settings.chatSelfName)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.chatSelfName = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
		.setName('昵称-QQ 表')
		.setDesc('用于设置聊天头像')
		.addTextArea(text => text
			.setPlaceholder('例如：马化腾=10001, 田所浩二=114514')
			.setValue(this.plugin.settings.chatQQandName)
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.chatQQandName = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('强制渲染对话时间')
		.setDesc('全局生效，目前仅部分格式生效')
		.addToggle(text => text
			.setValue(this.plugin.settings.isShowTime)
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.isShowTime = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
			.setName('强制渲染对话为md')
			.setDesc('全局生效，目前仅部分格式生效')
			.addToggle(text => text
				.setValue(this.plugin.settings.isRenderMd)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.isRenderMd = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('电脑风格')
			.setDesc('默认 (false) 为手机风格，电脑风格的字会更少，用于显示更多内容')
			.addToggle(text => text
				.setValue(this.plugin.settings.isPcStyle)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.isPcStyle = value;
					await this.plugin.saveSettings();

					if (value) { document.body.classList.add('pc-chat') } // 电脑风格
					else { document.body.classList.remove('pc-chat') } // 手机风格
				}));
	}
}
