import {Plugin, Notice} from "obsidian";
// import {MarkdownRenderChild} from "obsidian"; // md后处理器

// 全局设置
import {ChatPluginSettings, ChatSettingTab, DEFAULT_SETTINGS} from "./settings"
// 解析语法并渲染
import {chat_webvtt, chat, Chat_qq, chat_wechat} from "./codeBlock"


export default class ChatViewPlugin extends Plugin {
	settings: ChatPluginSettings; // 插件配置
	
	override async onload(): Promise<void> {
	// async onload() {
		// 插件配置
		await this.loadSettings();
		this.addSettingTab(new ChatSettingTab(this.app, this)); // 这将添加一个设置选项卡，以便用户可以配置插件的各个方面
		if (this.settings.width) document.documentElement.style.setProperty('--qq-width', this.settings.width+"px")
		if (this.settings.maxHeight) document.documentElement.style.setProperty('--qq-max-height', this.settings.maxHeight+"px")

		// chat-webvtt 格式
		this.registerMarkdownCodeBlockProcessor("chat-webvtt", (source, el, _) => {
			chat_webvtt(source, el, _)
		});

		// chat 格式
		this.registerMarkdownCodeBlockProcessor("chat", (source, el, _) => {
			chat(source, el, _)
		});

		// 【魔改】QQ 格式
		this.registerMarkdownCodeBlockProcessor("chat-qq", (source, el, _) => {
			new Chat_qq(source, el, _, this).render()
		});

		// 【魔改】微信 格式
		/*this.registerMarkdownCodeBlockProcessor("chat-wechat", (source, el, _) => {
			chat_wechat(source, el, _, this)
		});*/

		// Vault 是一个资源库，用于存储和管理文档和文件
		/*new Notice(this.app.vault.getName()); // 这个是整个库的名字
		console.log(this.app.vault.getFiles());*/
	}

	// 插件设置加载后，加载配置
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 插件设置保存后，加载配置
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
