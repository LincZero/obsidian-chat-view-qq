import {Platform, Notice, FileSystemAdapter, MarkdownPostProcessorContext} from "obsidian";

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
export function createChatBubble_withIcon(
  header: string,
  prevHeader: string,
  message: Array<string>,	// 支持多行信息
  subtext: string,
  align: string,
  element: HTMLElement,
  _: MarkdownPostProcessorContext,
  continued: boolean,
  headerIcon: Map<string, string>,
  selfConfigs: Array<String>,
  main_this: any
) {

  const marginClass = continued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
  const colorConfigClass = `chat-view-black`; //${colorConfigs.get(continued ? prevHeader : header)}`;
  /*const widthClass = formatConfigs.has("mw") ?
    `chat-view-max-width-${formatConfigs.get("mw")}`
    : (Platform.isMobile ? "chat-view-mobile-width" : "chat-view-desktop-width");*/
  const modeClass = `chat-view-bubble-mode-qq`//`chat-view-bubble-mode-default`//`chat-view-bubble-mode-${formatConfigs.has("mode") ? formatConfigs.get("mode") : "default"}`;
  /*const headerEl: keyof HTMLElementTagNameMap = formatConfigs.has("header") ?
    formatConfigs.get("header") as keyof HTMLElementTagNameMap :
    "h4";*/
  
  // 【新增self】指定
  if (selfConfigs && selfConfigs.includes(header)){
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
              let src = "app://local/"+this.app.vault.adapter.basePath+"/"+_.sourcePath.replace(/(\/(?!.*?\/).*?\.md$)/, "")+"/"+msg_splits[i]
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