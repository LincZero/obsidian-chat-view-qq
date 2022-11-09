import {Plugin, Platform, moment} from "obsidian";
import {App, PluginSettingTab, Setting, Notice} from "obsidian"; // 新增
import {MarkdownRenderChild} from "obsidian"; // md后处理器
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
				this.createChatBubble(
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
						this.createChatBubble(	// 创建聊天窗口
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

			// 重新整理格式变量
			{
				// 尝试修改css变量（会全局修改，还是不适合）
				/*
				let sytle_width = formatConfigs.get("width");
				if (sytle_width) document.documentElement.style.setProperty('--qq-width', sytle_width+"px")
				let style_max_height = formatConfigs.get("max-height");
				if (style_max_height) document.documentElement.style.setProperty('--qq-max-height', style_max_height+"px")
				*/
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

					this.createChatBubble_withIcon(
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

	/**
	 *  .chat-view-bubble.chat-view-bubble-mode-qq
	 * 	  .chat-view-qq-icon
	 *    	img
	 * 		.chat-view-qq-msg
	 * 			.chat-view-qq-header
	 * 			.pop
	 * 				.shape-zero
	 * 					.shape
	 * 				.chat-view-qq-message-all
	 * 					.chat-view-qq-message-line
	 * 						.chat-view-qq-message-text
	 * 						(.chat-view-qq-message-msg)
	 */
	// 创建聊天窗口（有头像版）被循环调用的
	private createChatBubble_withIcon(
		header: string,
		prevHeader: string,
		message: Array<string>,	// 支持多行信息
		subtext: string,
		align: string,
		element: HTMLElement,
		continued: boolean,
		headerIcon: Map<string, string>,
		formatConfigs: Map<string, string>
	) {

		const marginClass = continued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
		const colorConfigClass = `chat-view-black`; //${colorConfigs.get(continued ? prevHeader : header)}`;
		/*const widthClass = formatConfigs.has("mw") ?
			`chat-view-max-width-${formatConfigs.get("mw")}`
			: (Platform.isMobile ? "chat-view-mobile-width" : "chat-view-desktop-width");*/
		const modeClass = `chat-view-bubble-mode-qq`//`chat-view-bubble-mode-default`//`chat-view-bubble-mode-${formatConfigs.has("mode") ? formatConfigs.get("mode") : "default"}`;
		const headerEl: keyof HTMLElementTagNameMap = formatConfigs.has("header") ?
			formatConfigs.get("header") as keyof HTMLElementTagNameMap :
			"h4";
		
		// 【新增self】指定
		let selfHeader = formatConfigs.get("self");
		if (selfHeader && selfHeader==header){
			align = "right";
		} else {
			align = "left"
		}

		// 创建每条信息的根div
		const bubble = element.createDiv({
			cls: ["chat-view-bubble", `chat-view-align-${align}`, marginClass, colorConfigClass, /*widthClass,*/ modeClass],
		});

		// 创建icon项
		let iconSrc = headerIcon.get(header)
		const div_icon = bubble.createDiv({
			cls: ["chat-view-qq-icon"]
		});
		let div_img;
		{
			// img
			if (header.length > 0) {
				div_img = div_icon.createEl("img", {attr: {"src": iconSrc}});
			}
		}
		// 主题色
		/*
		console.log("准备获取主题色")
		let canvas = element.createEl('canvas')
		let context = canvas.getContext && canvas.getContext('2d')
		let img = new Image()
		img.onload = function() {
			context.drawImage(img, 0, 0)
			img.style.display = 'none'
			let imgData = (context.getImageData(0, 0, img.width, img.height)).data
			console.log(imgData)
			element.createEl('p', {text: String(imgData)})
		}
		//img.src="https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=182623993,1093186456&fm=27&gp=0.jpg"
		img.src="https://img1.baidu.com/it/u=4222289549,366398108&fm=253&fmt=auto&app=120&f=JPG?w=500&h=601"
		img.crossOrigin="anonymous"*/

		// 创建消息项
		const div_msg = bubble.createDiv({
			cls: ["chat-view-qq-msg"]
		});
		{
			// 发送者
			if (header.length > 0) {
				div_msg.createEl("p"/*headerEl*/, {text: header, cls: ["chat-view-qq-header"]});
			}
			div_msg.createDiv({attr: {"style": "clear: both;"}});
			if (message.length > 0) {
				let pop = div_msg.createDiv({cls: ["pop"]})
				{
					// 小尖角
					pop.createDiv({cls: ["shape-zero"]})
					.createDiv({cls: ["shape"]})
					// 全部信息
					let messages_all = pop.createEl("div", {cls: ["chat-view-qq-message-all", " word99"]});
					let qq_img_re = /!\[\]\((.*?[.jpg|.gif|.png|.webp])\)/
					for (let j=0; j<message.length; j++) {
						// 单行信息
						let msg_line = message[j]
						let message_line = messages_all.createEl("div", {cls: ["chat-view-qq-message-line"]});
						let msg_splits = msg_line.split(qq_img_re)
						if (msg_splits.length % 2 == 0) new Notice('【可能产生的错误】正则split分割数复数');
						for (let i=0; i<msg_splits.length; i++) {
							// 分隔后的信息
							if (i%2==0) message_line.createEl('span', {
								text: msg_splits[i], 
								cls: ["chat-view-qq-message-text"]
							});
							else message_line.createEl('img', {
								cls: ["chat-view-qq-message-msg"],
								attr: {"src": msg_splits[i].replace("file:///", "app://local/")}
							});
						}
					}
					/*
					if (qq_img_re.test(message)){
						let msg_array = message.split(qq_img_re)
						if (msg_array.length % 2 == 0) new Notice('【可能产生的错误】正则split分割数复数');
						for (let i=0; i<msg_array.length; i++) {
							if (i%2==0) message_div.createEl('span', {
								text: msg_array[i], 
								cls: ["chat-view-qq-message", " word99"],
								//attr:{"style": `background-color: ${rgb}`}
							});
							else message_div.createEl('img', {attr: {
								"src": msg_array[i].replace("file:///", "app://local/")}});
						}
					}
					// 信息 - 纯净版
					else {					
						message_div.createEl("span", {
							text: message, 
							cls: ["chat-view-qq-message", " word99"],
							//attr:{"style": `background-color: ${rgb}`}
						});
					}*/
				}
			}
			div_msg.createDiv({attr: {"style": "clear: both;"}});
		}
		bubble.createDiv({attr: {"style": "clear: both;"}});
		/*if (subtext.length > 0) div_msg.createEl("sub", {text: subtext, cls: ["chat-view-subtext"]});*/
	}

	// 获取主题色，https://www.jianshu.com/p/3367a26c17bb，canvas中getImageData方法
	/*private async GetColor(
		imgStr = "/2px-blue-and-1px-red-image.png"
	){
		const result = await analyze(imgStr) // also supports base64 encoded image strings
		// console.log(`The dominant color is ${result[0].color} with ${result[0].count} occurrence(s)`)
		// => The  dominant color is rgb(0,0,255) with 2 occurrence(s)
		// console.log(`The secondary color is ${result[1].color} with ${result[1].count} occurrence(s)`)
		// => The  secondary color is rgb(255,0,0) with 1 occurrence(s)
	}*/

	// 创建聊天窗口
	private createChatBubble(
		header: string,
		prevHeader: string,
		message: string,
		subtext: string,
		align: string,
		element: HTMLElement,
		continued: boolean,
		colorConfigs: Map<string, string>,
		formatConfigs: Map<string, string>,
	) {
		const marginClass = continued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
		const colorConfigClass = `chat-view-${colorConfigs.get(continued ? prevHeader : header)}`;
		const widthClass = formatConfigs.has("mw") ?
			`chat-view-max-width-${formatConfigs.get("mw")}`
			: (Platform.isMobile ? "chat-view-mobile-width" : "chat-view-desktop-width");
		const modeClass = `chat-view-bubble-mode-${formatConfigs.has("mode") ? formatConfigs.get("mode") : "default"}`;
		const headerEl: keyof HTMLElementTagNameMap = formatConfigs.has("header") ?
			formatConfigs.get("header") as keyof HTMLElementTagNameMap :
			"h4";
		// 创建div
		const bubble = element.createDiv({
			cls: ["chat-view-bubble", `chat-view-align-${align}`, marginClass, colorConfigClass, widthClass, modeClass]
		});
		// 创建元素
		if (header.length > 0) bubble.createEl(headerEl, {text: header, cls: ["chat-view-header"]});
		if (message.length > 0) bubble.createEl("p", {text: message, cls: ["chat-view-message"]});
		if (subtext.length > 0) bubble.createEl("sub", {text: subtext, cls: ["chat-view-subtext"]});
		/* 
		 * 说一下这个div结构
		 * 一层：Obsidian自带的
		 * 			cm-preview-code-block cm-embed-block markdown-rendered
		 * 二层：这里创建的整体
		 * 			block-language-chat-qq
		 * 三层：单个对话框
		 * 			chat-view-bubble chat-view-align-undefined chat-view-default-vertical-margin chat-view-undefined chat-view-desktop-width chat-view-bubble-mode-default
		 * 四层：h4、p、sub
		 */
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

/* 设置相关 */
interface ChatPluginSettings {
	chatSelfName: string,
	chatQQandName: string,
	width: Number,
	maxHeight: Number
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
	chatSelfName: '',
	chatQQandName: '',
	width: 900,
	maxHeight: 1100
}
/* 设置相关 */
class ChatSettingTab extends PluginSettingTab {
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
		.setDesc('【重启插件生效】用于渲染记录')
		.addText(text => text
			.setPlaceholder("例如：900")
			.setValue(String(this.plugin.settings.width))
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.width = Number(value);
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('默认渲染最大高度')
		.setDesc('【重启插件生效】用于渲染记录，超过后会变成滚动框')
		.addText(text => text
			.setPlaceholder("例如：1100")
			.setValue(String(this.plugin.settings.maxHeight))
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.maxHeight = Number(value);
				await this.plugin.saveSettings();
			}));
		
		new Setting(containerEl)
			.setName('自己的昵称')											 // 设置项名字
			.setDesc('自己的对话框将从右侧弹出')					 // 设置项提示
			.addText(text => text												// 输入框
				.setPlaceholder('自己的昵称')								// 没有内容时的提示
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
			.setPlaceholder('例如：昵称1=QQ1, 昵称2=QQ2')
			.setValue(this.plugin.settings.chatQQandName)
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.chatQQandName = value;
				await this.plugin.saveSettings();
			}));
	}
}