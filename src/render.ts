import {Platform, Notice, FileSystemAdapter, MarkdownPostProcessorContext} from "obsidian";

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

export class A_msg {
  msg_sender: string    								// 信息发送者
  msg_groupTitle: string								// 群头衔
  msg_iconSrc: string                   // 群头像
  msg_content = new Array<string>()			// 信息内容，注意数组
  msg_dateTime: string									// 信息日期和时间
  msg_isContinued: boolean							// 是否连发
  msg_isSelf: boolean                   // 是否自己
  msg_isShowTime: boolean               // 是否显示时间

  constructor(){}

  render(block_this: any) {
    const marginClass = this.msg_isContinued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
    const colorConfigClass = `chat-view-black`;
    const modeClass = `chat-view-bubble-mode-qq`
  
    // 创建每条信息的根div
    let el: HTMLElement = block_this.el
    const bubble = el.createDiv({
      cls: ["chat-view-bubble", `chat-view-align-${this.msg_isSelf ? "right" : "left"}`, marginClass, colorConfigClass, /*widthClass,*/ modeClass],
    });
  
    // 创建icon项
    const div_icon = bubble.createDiv({
      cls: ["chat-view-qq-icon"]
    });
    let div_img;
    {
      // img
      if (this.msg_sender.length > 0) {
        div_img = div_icon.createEl("img", {attr: {"src": this.msg_iconSrc}});
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
      if (this.msg_groupTitle.length > 0) {
        div_title.createEl("p", {text: this.msg_groupTitle, attr: {"title": this.msg_groupTitle}, cls: ["chat-view-qq-groupTitle"]});
      }
      // 发送者群昵称
      if (this.msg_sender.length > 0) {
        div_title.createEl("p", {text: this.msg_sender, cls: ["chat-view-qq-sender"]});
      }
      // 发送时间
      if (this.msg_isShowTime && this.msg_dateTime.length > 0) {
        div_title.createEl("p", {text: this.msg_dateTime, cls: ["chat-view-qq-dateTime"]})
      }
    }
    // 发送信息内容
    {
      div_msg.createDiv({attr: {"style": "clear: both;"}});
      if (this.msg_sender.length > 0) {
        let pop = div_msg.createDiv({cls: ["pop"]})
        {
          // 小尖角
          pop.createDiv({cls: ["shape-zero"]})
          .createDiv({cls: ["shape"]})
          // 全部信息
          let messages_all = pop.createEl("div", {cls: ["chat-view-qq-message-all", " word99"]});
          let qq_img_re = /!\[\]\((.*?[.jpg|.gif|.png|.webp])\)/
          for (let j=0; j<this.msg_content.length; j++) {
            // 单行信息
            let msg_line = this.msg_content[j]
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
                  +block_this.main_this.app.vault.adapter.basePath
                  +"/"
                  +block_this._.sourcePath.replace(/(\/(?!.*?\/).*?\.md$)/, "")
                  +"/"+msg_splits[i]
                message_line.createEl('img', {
                  cls: ["chat-view-qq-message-msg"],
                  attr: {"src": src }
                });
              }
            }
          }
        }
      }
      div_msg.createDiv({attr: {"style": "clear: both;"}});
    }
    bubble.createDiv({attr: {"style": "clear: both;"}});
  }
}

// 创建聊天窗口
export function createChatBubble(
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