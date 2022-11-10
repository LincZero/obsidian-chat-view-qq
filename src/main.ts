import {Plugin, Platform, moment, PluginSettingTab} from "obsidian";
import {MarkdownRenderChild} from "obsidian"; // md后处理器

import {ChatPluginSettings, ChatSettingTab, DEFAULT_SETTINGS} from "./settings"
import {createChatBubble, createChatBubble_withIcon} from "./render"

import * as webvtt from "node-webvtt";


const KEYMAP: Record<string, string> = {">": "right", "<": "left", "^": "center"};
const CONFIGS: Record<string, string[]> = {
	"header": ["h2", "h3", "h4", "h5", "h6"],
	"mw": ["50", "55", "60", "65", "70", "75", "80", "85", "90"],
	"mode": ["default", "minimal"],
};
const COLORS = [
	"red", "orange", "yellow", "green", "blue", "purple", "grey", "brown", "indigo", "teal", "pink", "slate", "wood"
];

// 正则匹配
class ChatPatterns {
	static readonly message = /(^>|<|\^)/;	// 发送消息，正则：>或<开头
	static readonly delimiter = /.../;			// 省略消息，正则：省略号
	static readonly comment = /^#/;					// 全局消息，正则：#开头
	static readonly colors = /\[(.*?)\]/;		// 颜色设置，正则：[]包围，例如[Albus Dumbledore=teal, Minerva McGonagall=pink]
	static readonly format = /{(.*?)}/;			// 格式设置，正则：{}包围，例如{mw=90,mode=minimal}
	static readonly joined = RegExp([this.message, this.delimiter, this.colors, this.comment, this.format]
		.map((pattern) => pattern.source)
		.join("|"));																				// 不名正则？
	static readonly voice = /<v\s+([^>]+)>([^<]+)<\/v>/;	// chat-webvtt模式下的对话检测

	static readonly qq_msg = /(.*?)(\s|&nbsp;)([0-2][0-9]:[0-6][0-9]:[0-6][0-9])/; // 第一个匹配项是名字，第二个是时间（日期先不管），下一行是消息
	static readonly qq_chehui = /(.*?)撤回了一条消息/;
	static readonly qq_jinqyun = /(.*?)加入本群。/;
}

interface Message {
	readonly header: string;
	readonly body: string;
	readonly subtext: string;
}

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
			const vtt = webvtt.parse(source, {meta: true});
			const messages: Message[] = [];
			const self = vtt.meta && "Self" in vtt.meta ? vtt.meta.Self as string : undefined;
			const selves = self ? self.split(",").map((val) => val.trim()) : undefined;

			const formatConfigs = new Map<string, string>();
			const maxWidth = vtt.meta && "MaxWidth" in vtt.meta ? vtt.meta.MaxWidth : undefined;
			const headerConfig = vtt.meta && "Header" in vtt.meta ? vtt.meta.Header : undefined;
			const modeConfig = vtt.meta && "Mode" in vtt.meta ? vtt.meta.Mode : undefined;
			if (CONFIGS["mw"].contains(maxWidth)) formatConfigs.set("mw", maxWidth);
			if (CONFIGS["header"].contains(headerConfig)) formatConfigs.set("header", headerConfig);
			if (CONFIGS["mode"].contains(modeConfig)) formatConfigs.set("mode", modeConfig);
			console.log(formatConfigs);

			for (let index = 0; index < vtt.cues.length; index++) {
				const cue = vtt.cues[index];
				const start = moment(Math.round(cue.start * 1000)).format("HH:mm:ss.SSS");
				const end = moment(Math.round(cue.end * 1000)).format("HH:mm:ss.SSS");
				if (ChatPatterns.voice.test(cue.text)) {
					const matches = (cue.text as string).match(ChatPatterns.voice);
					messages.push(<Message>{header: matches[1], body: matches[2], subtext: `${start} to ${end}`});
				} else {
					messages.push(<Message>{header: "", body: cue.text, subtext: `${start} to ${end}`});
				}
			}

			const headers = messages.map((message) => message.header);
			const uniqueHeaders = new Set<string>(headers);
			uniqueHeaders.delete("");
			console.log(messages);
			console.log(uniqueHeaders);

			const colorConfigs = new Map<string, string>();
			Array.from(uniqueHeaders).forEach((h, i) => colorConfigs.set(h, COLORS[i % COLORS.length]));
			console.log(colorConfigs);

			messages.forEach((message, index, arr) => {
				const prevHeader = index > 0 ? arr[index - 1].header : "";
				const align = selves && selves.contains(message.header) ? "right" : "left";
				const continued = message.header === prevHeader;
				createChatBubble(
					continued ? "" : message.header, prevHeader, message.body, message.subtext, align, el,
					continued, colorConfigs, formatConfigs,
				);
			});
		});

		// chat 格式
		this.registerMarkdownCodeBlockProcessor("chat", (source, el, _) => {
			const rawLines = source.split("\n").filter((line) => ChatPatterns.joined.test(line.trim()));
			const lines = rawLines.map((rawLine) => rawLine.trim());
			const formatConfigs = new Map<string, string>();
			const colorConfigs = new Map<string, string>();

			// 遍历1
			for (const line of lines) {
				// 匹配正则 "format"
				if (ChatPatterns.format.test(line)) {
					const configs = line.replace("{", "").replace("}", "").split(",").map((l) => l.trim());
					for (const config of configs) {
						const [k, v] = config.split("=").map((c) => c.trim());
						if (Object.keys(CONFIGS).contains(k) && CONFIGS[k].contains(v)) formatConfigs.set(k, v);
					}
				}
				// 匹配正则 "colors"
				else if (ChatPatterns.colors.test(line)) {
					const configs = line.replace("[", "").replace("]", "").split(",").map((l) => l.trim());
					for (const config of configs) {
						const [k, v] = config.split("=").map((c) => c.trim());
						if (k.length > 0 && COLORS.contains(v)) colorConfigs.set(k, v);
					}
				}
			}
			// 遍历2（重设行数，重新遍历。先知道了格式后，再来渲染对话）
			let continuedCount = 0;
			for (let index = 0; index < lines.length; index++) {
				const line = lines[index].trim();
				// 全局消息
				if (ChatPatterns.comment.test(line)) {
					el.createEl("p", {text: line.substring(1).trim(), cls: ["chat-view-comment"]})
				}
				// 省略消息
				else if (line === "...") {
					const delimiter = el.createDiv({cls: ["delimiter"]});
					for (let i = 0; i < 3; i++) delimiter.createDiv({cls: ["dot"]});
				}
				// 对话消息
				else if (ChatPatterns.message.test(line)) {
					const components = line.substring(1).split("|");
					if (components.length > 0) {
						const first = components[0];																									// 说话的人
						const header = components.length > 1 ? first.trim() : "";											// ？信息头？
						const message = components.length > 1 ? components[1].trim() : first.trim();	// 发送的信息
						const subtext = components.length > 2 ? components[2].trim() : "";						// 底部文字（通常是时间）
						const continued = index > 0 && line.charAt(0) === lines[index - 1].charAt(0) && header === ""; // 上一消息是不是同一个人发的
						let prevHeader = "";
						if (continued) {
							continuedCount++;
							const prevComponents = lines[index - continuedCount].trim().substring(1).split("|");
							prevHeader = prevComponents[0].length > 1 ? prevComponents[0].trim() : "";
						} else {
							continuedCount = 0;
						}
						createChatBubble(	// 创建聊天窗口
							header, prevHeader, message, subtext, KEYMAP[line.charAt(0)], el, continued,
							colorConfigs, formatConfigs,
						);
					}
				}
			}
		});

		// 【魔改】QQ 格式
		this.registerMarkdownCodeBlockProcessor("chat-qq", (source, el, _) => {
			// 这一步把空行全部搞没了…………
			const rawLines = source.split("\n")/*.filter((line) => ChatPatterns.joined.test(line.trim()))*/;
			const lines = rawLines.map((rawLine) => rawLine.trim());
			const formatConfigs = new Map<string, string>();
			const colorConfigs = new Map<string, string>();

			const headerIcon = new Map<string, string>();		// 魔改新增：头像图片
			let icons = [
				//"https://img1.baidu.com/it/u=3799393477,744941171&fm=253",
				"https://img0.baidu.com/it/u=3452693033,2914629743&fm=253",
				"https://img2.baidu.com/it/u=2231228778,2513904551&fm=253",
				"https://img1.baidu.com/it/u=2012765083,4167954819&fm=253",
				"https://t7.baidu.com/it/u=244930557,2366914938&fm=167",
				"https://img1.baidu.com/it/u=492888272,1423520386&fm=253",
				"https://img0.baidu.com/it/u=140901730,1320734199&fm=253",
				"https://img0.baidu.com/it/u=277980071,3715613478&fm=253",
				"https://img2.baidu.com/it/u=2666269671,1837195739&fm=253",
				"https://img2.baidu.com/it/u=804455831,2693824866&fm=253",
				"https://img0.baidu.com/it/u=2940741436,1248193933&fm=253"
			]
			const numDefaultIcon = icons.length;						// 魔改新增：图库中含有图片数量
			let countDefaultIcon = 0; 											// 魔改新增：已使用的图库数量

			// 遍历1 (配置遍历)
			// 先设置缺省再遍历
			if (this.settings.chatSelfName) formatConfigs.set("self", this.settings.chatSelfName);
			if (this.settings.chatQQandName) {
				const configs = this.settings.chatQQandName.split(",").map((l) => l.trim());
				for (const config of configs) {
					const [k, v] = config.split("=").map((c) => c.trim());
					if (k.length > 0) colorConfigs.set(k, v);
				}
			}
			for (const line of lines) {
				// 匹配正则 "format"
				if (ChatPatterns.format.test(line)) {
					const configs = line.replace("{", "").replace("}", "").split(",").map((l) => l.trim());
					for (const config of configs) {
						const [k, v] = config.split("=").map((c) => c.trim());
						/*if (Object.keys(CONFIGS).contains(k) && CONFIGS[k].contains(v))*/ formatConfigs.set(k, v);
					}
				}
				// 匹配正则 "colors"
				if (ChatPatterns.colors.test(line)) {
					const configs = line.replace("[", "").replace("]", "").split(",").map((l) => l.trim());
					for (const config of configs) {
						const [k, v] = config.split("=").map((c) => c.trim());
						if (k.length > 0 /*&& COLORS.contains(v)*/) colorConfigs.set(k, v);
					}
				}
			}

			// 遍历2（重设行数，重新遍历。先知道了格式后，再来渲染对话）
			let continuedCount = 0;
			for (let index = 0; index < lines.length; index++) {
				let line = lines[index].trim();
				// 全局消息
				/*if (ChatPatterns.comment.test(line)) {
					el.createEl("p", {text: line.substring(1).trim(), cls: ["chat-view-comment"]})
				}*/
				// 省略消息
				if (line === "...") {
					const delimiter = el.createDiv({cls: ["delimiter"]});
					for (let i = 0; i < 3; i++) delimiter.createDiv({cls: ["dot"]});
				}
				// 撤回消息【魔改】
				else if (ChatPatterns.qq_chehui.test(line)) {
					el.createEl("p", {text: line.trim(), cls: ["chat-view-comment", "chat-view-qq-comment"]})
				}
				// 进群消息【魔改】
				else if (ChatPatterns.qq_jinqyun.test(line)) {
					el.createEl("p", {text: line.trim(), cls: ["chat-view-comment", "chat-view-qq-comment"]})
				}
				// 对话消息【魔改】
				else if (ChatPatterns.qq_msg.test(line)) {
					/*el.createEl("p", {text: "===============", cls: ["chat-view-comment", "chat-view-qq-comment"]})
					el.createEl("p", {text: line.trim(), cls: ["chat-view-comment", "chat-view-qq-comment"]})*/
					const header = line.match(ChatPatterns.qq_msg)[1]
					const continued = index > 0 && line.charAt(0) === lines[index - 1].charAt(0);
					const subtext = line.match(ChatPatterns.qq_msg)[2];
					let prevHeader = "";
					
					// 支持多行信息
					let message = new Array()
					while(true){
						if (index >= lines.length-1) break;
						index++;
						line = lines[index].trim().replace("&nbsp;", " ");
						if (line.replace(/\s*/g,"")=="") break;
						message.push(line);
					}

					// 如果没有头像，则自动分配头像
					if (!headerIcon.get(header)) {
						let qqHeader = colorConfigs.get(header)
						// 有指定头像
						if (qqHeader) {
							// QQ头像
							if (/^\d+$/.test(qqHeader)) headerIcon.set(header, `http://q2.qlogo.cn/headimg_dl?dst_uin=${qqHeader}&spec=40`);
							// 颜色头像
							// else if (COLORS.contains(qqHeader)) headerIcon.set(header, `flagColor_${qqHeader}`) // 颜色标记
							// 网址头像
							else headerIcon.set(header, qqHeader);
						}
						// 自动分配默认头像
						else if (countDefaultIcon < numDefaultIcon) {
							/*let file, scripts = document.getElementsByTagName("script"); 
							file = scripts[scripts.length - 1].getAttribute("src");

							let path2 = require('dfs').join(adapter.getBasePath(), this.manifest.dir);*/

							headerIcon.set(header, icons[countDefaultIcon++])
						}
						// 默认QQ头像
						else {
							headerIcon.set(header, `http://q2.qlogo.cn/headimg_dl?dst_uin=0&spec=40`);
						}
					}
				
					// 该渲染项的设置，会覆盖全局设置
					let sytle_width = formatConfigs.get("width");
					let style_max_height = formatConfigs.get("max-height");
					let style_all = ""
					if (sytle_width) style_all+=`;width: ${sytle_width}px`
					if (style_max_height) style_all+=`;max-height: ${style_max_height}px`
					if (style_all) el.setAttr("Style", style_all)

					createChatBubble_withIcon(
						header,											// header
						prevHeader,									// prevHeader
						message,										// message，注意自增
						subtext,										// subtext
						KEYMAP[line.charAt(0)], 
						el,
						continued,									// continued
						headerIcon,
						formatConfigs
					);
				}
			}
		});
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