import {Platform, Notice, FileSystemAdapter, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer} from "obsidian";

/**
 *  .chat-view-bubble.chat-view-bubble-mode-qq
 * 	  .chat-view-qq-icon
 *    	img
 * 		.chat-view-qq-msg
 *      .chat-view-qq-title
 *        .chat-view-qq-groupTitle
 * 			  .chat-view-qq-sender
 *        .chat-view-qq-dateTime
 * 			.pop
 * 				.shape-zero
 * 					.shape
 * 				.chat-view-qq-message-all
 * 					.chat-view-qq-message-line
 * 						.chat-view-qq-message-text
 * 						(.chat-view-qq-message-msg)
 */

export class MsgItem {
  block_this: any

  // 必填参数
  sender: string    								// 信息发送者
  iconSrc: string                   // 群头像
  content = new Array<string>()			// 信息内容，注意数组

  // 可选参数
  groupTitle: string = ""						// 群头衔
  dateTime: string = ""							// 信息日期和时间
  isContinued: boolean = false			// 是否连发
  isSelf: boolean = false           // 是否自己

  LStyle = ["qq", "wechat", "default"]

  constructor(block_this: any){
    this.block_this = block_this
  }

  render() {
    if (this.block_this.style=="qq") this.render_qq()
    else this.render_default()
  }

  render_qq() {
    const marginClass = this.isContinued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
    const colorConfigClass = `chat-view-black`;
    const modeClass = `chat-view-bubble-mode-${this.block_this.style}`;
  
    // 创建每条信息的根div
    let el: HTMLElement = this.block_this.el
    const bubble = el.createDiv({
      cls: ["chat-view-bubble", `chat-view-align-${this.isSelf ? "right" : "left"}`, marginClass, colorConfigClass, /*widthClass,*/ modeClass],
    });
  
    // 创建icon项
    const div_icon = bubble.createDiv({
      cls: ["chat-view-qq-icon"]
    });
    let div_img;
    {
      // img
      if (this.sender.length > 0) {
        div_img = div_icon.createEl("img", {attr: {"src": this.iconSrc}});
      }
    }
    // 创建消息项
    const div_msg = bubble.createDiv({
      cls: ["chat-view-qq-msg"]
    });  
    // 发送附属信息
    {
      let div_title = div_msg.createDiv({cls: ["chat-view-qq-title"]})
      // 发送者群头衔
      if (this.groupTitle.length > 0) {
        div_title.createEl("p", {text: this.groupTitle, attr: {"title": this.groupTitle}, cls: ["chat-view-qq-groupTitle"]});
      }
      // 发送者群昵称
      if (this.sender.length > 0) {
        div_title.createEl("p", {text: this.sender, cls: ["chat-view-qq-sender"]});
      }
      // 发送时间
      if (this.block_this.isShowTime && this.dateTime.length > 0) {
        div_title.createEl("p", {text: this.dateTime, cls: ["chat-view-qq-dateTime"]})
      }
    }
    // 发送信息内容
    ;(()=>{
      div_msg.createDiv({attr: {"style": "clear: both;"}});
      if (this.sender.length <= 0) {
        div_msg.createDiv({attr: {"style": "clear: both;"}});
        return
      }
      let pop = div_msg.createDiv({cls: ["pop"]})
      // 小尖角
      pop.createDiv({cls: ["shape-zero"]})
      .createDiv({cls: ["shape"]})
      // 全部信息
      let messages_all = pop.createEl("div", {cls: ["chat-view-qq-message-all", " word99"]});

      // b1. md渲染
      if (this.block_this.main_this.settings.isRenderMd) {
        messages_all.classList.add("markdown-rendered")
        const mdrc: MarkdownRenderChild = new MarkdownRenderChild(messages_all);
        if (this.block_this.ctx) this.block_this.ctx.addChild(mdrc);
        MarkdownRenderer.render(this.block_this.main_this.app, this.content.join('\n'), messages_all, this.block_this.main_this.app.workspace.activeLeaf?.view?.file?.path??"", mdrc)
      }
      // b2. 普通渲染
      else {
        let qq_img_re = /!\[\]\((.*?[.jpg|.gif|.png|.webp])\)/
        for (let j=0; j<this.content.length; j++) {
          // 单行信息
          let msg_line = this.content[j]
          let message_line = messages_all.createEl("div", {cls: ["chat-view-qq-message-line"]});
          let msg_splits = msg_line.split(qq_img_re)
          if (msg_splits.length % 2 == 0) new Notice('【可能产生的错误】正则split分割数复数');
          for (let i=0; i<msg_splits.length; i++) {
            // 分隔后的文字信息
            if (i%2==0) message_line.createEl('span', {
              text: msg_splits[i], 
              cls: ["chat-view-qq-message-text"]
            });
            // 分隔后的QQ图片/绝对路径图片信息
            else if (/^file:\/\/\//.test(msg_splits[i])) {
              message_line.createEl('img', {
                cls: ["chat-view-qq-message-msg"],
                attr: {"src": msg_splits[i].replace("file:///", "app://local/")}
              });
            }
            // 网址图片
            else if(/^http/.test(msg_splits[i])) {
              message_line.createEl('img', {
                cls: ["chat-view-qq-message-msg"],
                attr: {"src": msg_splits[i] }
              });
            }
            // 分隔后的普通图片信息（相对路径）
            else {
              // this.app.vault.adapter.basePath // 可能报错，但能运行
              // this.app.vault.getName()
              let src = "app://local/"
                +this.block_this.main_this.app.vault.adapter.basePath
                +"/"
                +this.block_this._.sourcePath.replace(/(\/(?!.*?\/).*?\.md$)/, "")
                +"/"+msg_splits[i]
              message_line.createEl('img', {
                cls: ["chat-view-qq-message-msg"],
                attr: {"src": src }
              });
            }
          }
        }
      }
      div_msg.createDiv({attr: {"style": "clear: both;"}});
    })()
    bubble.createDiv({attr: {"style": "clear: both;"}});
  }

  render_default() {
    const marginClass = this.isContinued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
    // const colorConfigClass = `chat-view-${colorConfigs.get(continued ? prevHeader : header)}`;
    const widthClass = this.block_this.formatConfigs.has("mw") ?
      `chat-view-max-width-${this.block_this.formatConfigs.get("mw")}`
      : (Platform.isMobile ? "chat-view-mobile-width" : "chat-view-desktop-width");
    const modeClass = `chat-view-bubble-mode-${this.block_this.style}`;
    const headerEl:keyof HTMLElementTagNameMap = "h4"
    /*= formatConfigs.has("header") ?
      formatConfigs.get("header") as keyof HTMLElementTagNameMap :
      "h4";*/
    // 创建div
    let el: HTMLElement = this.block_this.el
    const bubble = el.createDiv({
      cls: ["chat-view-bubble", `chat-view-align-${this.isSelf ? "right" : "left"}`, marginClass/*, colorConfigClass, widthClass*/, modeClass]
    });
    // 创建元素
    if (this.sender.length > 0) bubble.createEl(headerEl, {text: this.sender, cls: ["chat-view-header"]});
    if (this.content[0].length > 0) bubble.createEl("p", {text: this.content[0], cls: ["chat-view-message"]});
    if (this.dateTime.length > 0) bubble.createEl("sub", {text: this.dateTime, cls: ["chat-view-subtext"]});
  }
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
