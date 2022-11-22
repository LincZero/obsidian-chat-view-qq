import {createChatBubble, MsgItem} from "./render"
import {ChatPluginSettings} from "./settings"
import {registerContextMenu} from "./contextMenu"

import * as webvtt from "node-webvtt";
import { moment, Notice } from 'obsidian'
import { MarkdownPostProcessorContext } from 'obsidian';

// 通用 Chat 基类
export class Chat {
  static readonly reg_icon = /\[(.*?)\]/;		// 颜色设置，正则：[]包围，例如[Albus Dumbledore=teal, Minerva McGonagall=pink]
  static readonly reg_format = /{(.*?)}/;			// 格式设置，正则：{}包围，例如{mw=90,mode=minimal}
  
  protected source: string;                       // 代码块里的内容
  public el: HTMLElement;                      // 注册渲染的元素
  protected _: MarkdownPostProcessorContext;      // Md后处理器上下文
  protected main_this: any;                       // 上一层指针

  lines = new Array<string>()                   // source的array化
  formatConfigs = new Map<string, string>()     // 配置
  selfConfigs = new Array<string>()             // 多个己方
  iconConfigs = new Map<string, string>()       // 未处理的头像
  iconSrcConfigs = new Map<string, string>()    // 处理过后的头像
  isShowTime = false                            // 是否显示时间
  from: string                                  // 格式模式
  style: string                                 // 渲染模式

  icons = [
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
  ];
  numDefaultIcon = this.icons.length;		        // 图库中含有图片数量
  countDefaultIcon = 0; 											  // 已使用的图库数量

  // 构造
  constructor(
    source: string,
    el: HTMLElement,
    _: MarkdownPostProcessorContext,
    main_this: any,
  ){
    this.source = source;
    this.el = el;
    this._ =  _;
    this. main_this = main_this;

    const rawLines = source.split("\n");
    this.lines = rawLines.map((rawLine) => rawLine.trim());

    this.config()
  }

  // 全局配置与局部配置
  config(){
    // 全局配置
    let settings: ChatPluginSettings = this.main_this.settings
    if (settings.chatSelfName) {
      const configs = settings.chatSelfName.split(",").map((l) => l.trim());
      this.selfConfigs = configs
    }
    if (settings.chatQQandName) {
      const configs = settings.chatQQandName.split(",").map((l) => l.trim());
      for (const config of configs) {
        const [k, v] = config.split("=").map((c) => c.trim());
        if (k.length > 0) this.iconConfigs.set(k, v);
      }
    }

    // 局部配置
    for (const line of this.lines) {
      // 匹配正则 "format"
      if (Chat.reg_format.test(line)) {
        const configs = line.replace("{", "").replace("}", "").split(",").map((l) => l.trim());
        for (const config of configs) {
          const [k, v] = config.split("=").map((c) => c.trim());
          this.formatConfigs.set(k, v);
        }
      }
      // 匹配正则 "icon"
      if (Chat.reg_icon.test(line)) {
        const configs = line.replace("[", "").replace("]", "").split(",").map((l) => l.trim());
        for (const config of configs) {
          const [k, v] = config.split("=").map((c) => c.trim());
          if (k.length > 0) this.iconConfigs.set(k, v);
        }
      }
    }
    // 梳理formatConfigs
    if (this.formatConfigs){
      if (this.formatConfigs.get("self")) this.selfConfigs.push(this.formatConfigs.get("self"));
      if (this.formatConfigs.get("style")) this.style = this.formatConfigs.get("style");
      else if (this.formatConfigs.get("mode")) this.style = this.formatConfigs.get("mode");
      if (this.formatConfigs.get("from")) this.from = this.formatConfigs.get("from");
      if (this.formatConfigs.get("time")) {
        let strShowTime:string = this.formatConfigs.get("time")
        this.isShowTime = (strShowTime=="show" || strShowTime=="true")
      }
    }
  }

  // 将icon配置转化成icon地址
  iconConfig(msgItem: MsgItem){
    // iconSrcConfig中没有，就从iconConfig中去找并处理后放到iconSrcConfig中
    if (!this.iconSrcConfigs.get(msgItem.sender)) {
      let iconConfigsItem = this.iconConfigs.get(msgItem.sender)
      let iconSrcConfigsItem = ""
      // 有指定头像
      if (iconConfigsItem) {
        // QQ头像
        if (/^\d+$/.test(iconConfigsItem)) {
          iconSrcConfigsItem = `http://q2.qlogo.cn/headimg_dl?dst_uin=${iconConfigsItem}&spec=40`
        }
        // 网址头像
        else if(/^http/.test(iconConfigsItem)) {
          iconSrcConfigsItem = iconConfigsItem
        }
        // 相对路径图片
        else if(/(.*?)(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.bmp)$/gi.test(iconConfigsItem)) {
          iconSrcConfigsItem = "app://local/"+this.main_this.app.vault.adapter.basePath+"/"+this._.sourcePath.replace(/(\/(?!.*?\/).*?\.md$)/, "")+"/"+iconConfigsItem
        }
        // 其他头像
        else {
          iconSrcConfigsItem = iconConfigsItem
        }
      }
      // 无指定头像，自动分配默认头像
      else {
        // 随机头像
        if (this.countDefaultIcon < this.numDefaultIcon) {
          iconSrcConfigsItem = this.icons[this.countDefaultIcon++]
        }
        // 默认QQ头像
        else {
          iconSrcConfigsItem = `http://q2.qlogo.cn/headimg_dl?dst_uin=0&spec=40`
        }
      }
      this.iconSrcConfigs.set(msgItem.sender, iconSrcConfigsItem)
    }
    msgItem.iconSrc = this.iconSrcConfigs.get(msgItem.sender)
  }
  
  // 渲染
  render(){
    console.log("没有重载 render()！")
    new Notice("没有重载 render()！")
    throw "没有重载 render()！"
  }
}

// Webvtt 格式
export class Chat_webvtt extends Chat {
  // override render method
  render(){
    this.from = this.from ? this.from : "webvtt"
    this.style = this.style ? this.style : "webvtt"

    interface Message {
      readonly header: string;
      readonly body: string;
      readonly subtext: string;
    }
    const COLORS = [
      "red", "orange", "yellow", "green", "blue", "purple", "grey", "brown", "indigo", "teal", "pink", "slate", "wood"
    ];
    const CONFIGS: Record<string, string[]> = {
      "header": ["h2", "h3", "h4", "h5", "h6"],
      "mw": ["50", "55", "60", "65", "70", "75", "80", "85", "90"],
      "mode": ["default", "minimal"],
    };

    const vtt = webvtt.parse(this.source, {meta: true});
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
      if (/<v\s+([^>]+)>([^<]+)<\/v>/.test(cue.text)) {
        const matches = (cue.text as string).match(/<v\s+([^>]+)>([^<]+)<\/v>/);
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
        continued ? "" : message.header, prevHeader, message.body, message.subtext, align, this.el,
        continued, colorConfigs, formatConfigs,
      );
    });
  }
}

// 原版 Chat 格式
export class Chat_original extends Chat {
  // override render method
  render(){
    this.from = this.from ? this.from : "default"
    this.style = this.style ? this.style : "default"

    let continuedCount = 0;
    for (let index = 0; index < this.lines.length; index++) {
      const line = this.lines[index].trim();
      // 全局消息
      if (/^#/.test(line)) {
        this.el.createEl("p", {text: line.substring(1).trim(), cls: ["chat-view-comment"]})
      }
      // 省略消息
      else if (line === "...") {
        const delimiter = this.el.createDiv({cls: ["delimiter"]});
        for (let i = 0; i < 3; i++) delimiter.createDiv({cls: ["dot"]});
      }
      // 对话消息
      else if (/(^>|<|\^)/.test(line)) {
        let msgItem = new MsgItem(this)
        
        const components = line.substring(1).split("|");
        if (components.length > 0) {
          const first = components[0];
          msgItem.sender = components.length > 1 ? first.trim() : "";
          msgItem.groupTitle = ""
          msgItem.iconSrc = ""
          msgItem.content.push(components.length > 1 ? components[1].trim() : first.trim());
          msgItem.dateTime = components.length > 2 ? components[2].trim() : "";
          msgItem.isContinued = index > 0 && line.charAt(0) === this.lines[index - 1].charAt(0) && msgItem.sender === "";
          msgItem.isSelf = line.charAt(0) == "<" ? true : false // 删掉了 ^: center

          msgItem.render()
        }
      }
    }
  }
}

// QQ 格式
export class Chat_qq extends Chat {
  static readonly reg_qq_msg = /(.*?)(\s|&nbsp;)(\d\d\d\d-\d\d-\d\d(\s|&nbsp;))?([0-2]?[0-9]:[0-6][0-9]:[0-6][0-9])(\s*?)$/; // 1~6分别是：名字 空格 日期空格 空格 时间 空格
  static readonly reg_qq_qunTouXian = /【(.*?)】(.*?$)/
  static readonly reg_qq_chehui = /(.*?)撤回了一条消息/;
  static readonly reg_qq_jinqyun = /(.*?)加入本群。/;

  // override render method
  render(){
    this.from = this.from ? this.from : "qq"
    this.style = this.style ? this.style : "qq"

    let continuedCount = 0;
    for (let index = 0; index < this.lines.length; index++) {
      let line = this.lines[index].trim();
      // 省略消息
      if (line === "...") {
        const delimiter = this.el.createDiv({cls: ["delimiter"]});
        for (let i = 0; i < 3; i++) delimiter.createDiv({cls: ["dot"]});
      }
      // 撤回消息
      else if (Chat_qq.reg_qq_chehui.test(line)) {
        this.el.createEl("p", {text: line.trim(), cls: ["chat-view-comment", "chat-view-qq-comment"]})
      }
      // 进群消息
      else if (Chat_qq.reg_qq_jinqyun.test(line)) {
        this.el.createEl("p", {text: line.trim(), cls: ["chat-view-comment", "chat-view-qq-comment"]})
      }
      // 对话消息
      else if (Chat_qq.reg_qq_msg.test(line)) {
        let msgItem = new MsgItem(this)

        msgItem.sender = line.match(Chat_qq.reg_qq_msg)[1]                               // 消息发送者
        msgItem.groupTitle = ""                                                           // 消息发送者群头衔
        if (Chat_qq.reg_qq_qunTouXian.test(msgItem.sender)) {
          msgItem.groupTitle = msgItem.sender.match(Chat_qq.reg_qq_qunTouXian)[1];
          msgItem.sender = msgItem.sender.match(Chat_qq.reg_qq_qunTouXian)[2];
        }
        msgItem.isContinued = index > 0 && line.charAt(0) === this.lines[index - 1].charAt(0); // 是否与上句是同一人发的
        const msg_date: string = line.match(Chat_qq.reg_qq_msg)[3] ? line.match(Chat_qq.reg_qq_msg)[3]: ""
        const msg_time: string = line.match(Chat_qq.reg_qq_msg)[5] ? line.match(Chat_qq.reg_qq_msg)[5]: ""
        msgItem.dateTime = msg_date + msg_time                                          // 日期时间
        
        while(true){
          if (index >= this.lines.length-1) break;
          index++;
          line = this.lines[index].trim().replace("&nbsp;", " ");
          if (line.replace(/\s*/g,"")=="") break;
          msgItem.content.push(line);
        }

        this.iconConfig(msgItem)
      
        // 该渲染项的设置，会覆盖全局设置
        let sytle_width = this.formatConfigs.get("width");
        let style_max_height = this.formatConfigs.get("max-height");
        let style_all = ""
        if (sytle_width) style_all+=`;width: ${sytle_width}px`
        if (style_max_height) style_all+=`;max-height: ${style_max_height}px`
        if (style_all) this.el.setAttr("Style", style_all)

        msgItem.isSelf = this.selfConfigs.includes(msgItem.sender)
        
        msgItem.render()

        registerContextMenu(this.el, this)
      }
    }
  }
}

// 【魔改】微信格式
export class Chat_wechat extends Chat {
  static readonly reg_wechat_msg = /(.*?)(:\s*?)$/

  // override render method
  render(){
    this.from = this.from ? this.from : "qq"
    this.style = this.style ? this.style : "qq"

    let continuedCount = 0;
    for (let index = 0; index < this.lines.length; index++) {
      let line = this.lines[index].trim();
      // 省略消息
      if (line === "...") {
        const delimiter = this.el.createDiv({cls: ["delimiter"]});
        for (let i = 0; i < 3; i++) delimiter.createDiv({cls: ["dot"]});
      }
      // 对话消息
      else if (Chat_wechat.reg_wechat_msg.test(line)) {
        let msgItem = new MsgItem(this)

        msgItem.sender = line.match(Chat_wechat.reg_wechat_msg)[1]
        msgItem.groupTitle = ""
        msgItem.isContinued = index > 0 && line.charAt(0) === this.lines[index - 1].charAt(0);
        msgItem.dateTime = ""
        
        while(true){
          if (index >= this.lines.length-1) break;
          index++;
          line = this.lines[index].trim().replace("&nbsp;", " ");
          if (line.replace(/\s*/g,"")=="") break;
          msgItem.content.push(line);
        }

        this.iconConfig(msgItem)
      
        // 该渲染项的设置，会覆盖全局设置
        let sytle_width = this.formatConfigs.get("width");
        let style_max_height = this.formatConfigs.get("max-height");
        let style_all = ""
        if (sytle_width) style_all+=`;width: ${sytle_width}px`
        if (style_max_height) style_all+=`;max-height: ${style_max_height}px`
        if (style_all) this.el.setAttr("Style", style_all)

        msgItem.isSelf = this.selfConfigs.includes(msgItem.sender)
        
        msgItem.render()

        registerContextMenu(this.el, this)
      }
    }
  }
}