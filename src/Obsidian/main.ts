import {Plugin, Notice} from "obsidian";

import {ChatPluginSettings, ChatSettingTab, DEFAULT_SETTINGS} from "./settings"
import {Chat_webvtt, Chat_original, Chat_qq, Chat_wechat, Chat_telegram, Chat_auto} from "../Core/codeBlock"

import { render_setting } from "../Core/render"
import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { registerContextMenu } from "./contextMenu"

/* 文件引用流
 * main.ts
 * codeBlock.ts 	负责解析语法，循环调用render.ts的A_msg类
 * render.ts 			负责生成对话项
 * settings.ts 		全局设置菜单
 * 
 * main.ts 			<- codeBlock.ts
 *         			<- settings.ts
 * codeBlock.ts <- render.ts
 */

export default class ChatViewPlugin extends Plugin {
	settings: ChatPluginSettings; // 插件配置
	
	async onload(): Promise<void> {
		// 初始化渲染函数
		render_setting.fn_renderMarkdown = (md: string, el: HTMLElement, ctx: any) => {
			el.classList.add("markdown-rendered")
			const mdrc: MarkdownRenderChild = new MarkdownRenderChild(el);
			if (ctx) ctx.addChild(mdrc);
			// @ts-ignore 新接口，但旧接口似乎不支持
			MarkdownRenderer.render(this.app, md, el, this.app.workspace.activeLeaf?.view?.file?.path??"", mdrc)
			// MarkdownRenderer.render(this.block_this.main_this.app, this.content.join('\n'), messages_all, this.block_this.main_this.app.workspace.activeLeaf?.view?.file?.path??"", mdrc)
		}
		render_setting.registerContextMenu = registerContextMenu

		// 插件配置
		await this.loadSettings();
		this.addSettingTab(new ChatSettingTab(this.app, this)); // 这将添加一个设置选项卡，以便用户可以配置插件的各个方面
		if (this.settings.width) document.documentElement.style.setProperty('--qq-width',
			Number.isFinite(Number(this.settings.width)) ? this.settings.width+'px' : this.settings.width)
		if (this.settings.maxHeight) document.documentElement.style.setProperty('--qq-max-height',
			Number.isFinite(Number(this.settings.maxHeight)) ? this.settings.maxHeight+'px' : this.settings.maxHeight)

		if (this.settings.isPcStyle) { document.body.classList.add('pc-chat') } // 电脑风格
		else { document.body.classList.remove('pc-chat') } // 手机风格

		// webvtt 格式
		this.registerMarkdownCodeBlockProcessor("chat-webvtt", (source, el, _) => {
			new Chat_webvtt(source, el, _, this).render()
		});

		// chat 格式
		this.registerMarkdownCodeBlockProcessor("chat-old", (source, el, _) => {
			new Chat_original(source, el, _, this).render()
		});

		// 自动 格式
		this.registerMarkdownCodeBlockProcessor("chat", (source, el, _) => {
			new Chat_auto(source, el, _, this).render()
		});

		// QQ 格式
		this.registerMarkdownCodeBlockProcessor("chat-qq", (source, el, _) => {
			new Chat_qq(source, el, _, this).render()
		});

		// 微信 格式
		this.registerMarkdownCodeBlockProcessor("chat-wechat", (source, el, _) => {
			new Chat_wechat(source, el, _, this).render()
		});

		// 电报 格式
		this.registerMarkdownCodeBlockProcessor("chat-tg", (source, el, _) => {
			new Chat_telegram(source, el, _, this).render()
		});

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
