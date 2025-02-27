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

export const render_setting: { // 需要初始化
  fn_renderMarkdown: any,
  registerContextMenu: any,
  main_setting: any
} = {
  fn_renderMarkdown: (md: string, el: HTMLElement, ctx: any) => {},
  registerContextMenu: (codeBlock_this: any) => {},
  main_setting: {}
}

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
    if (this.block_this.style=="qq" || this.block_this.style=="wechat") this.render_qq()
    else this.render_default()
  }

  render_qq() {
    const marginClass = this.isContinued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
    const colorConfigClass = `chat-view-black`;
    const modeClass = `chat-view-bubble-mode-${this.block_this.style}`;
  
    // 创建每条信息的根div
    const el: HTMLElement = this.block_this.el; el.classList.add(modeClass)
    const bubble = document.createElement('div'); el.appendChild(bubble); bubble.classList.add("chat-view-bubble", `chat-view-align-${this.isSelf ? "right" : "left"}`, marginClass, colorConfigClass, /*widthClass,*/ modeClass)

    // 创建icon项
    const div_icon = document.createElement('div'); bubble.appendChild(div_icon); div_icon.classList.add("chat-view-qq-icon")
    let div_img;
    {
      // img
      if (this.sender.length > 0) {
        div_img = document.createElement('img'); div_icon.appendChild(div_img); div_img.setAttribute('src', this.iconSrc)
      }
    }
    // 创建消息项
    const div_msg = document.createElement('div'); bubble.appendChild(div_msg); div_msg.classList.add("chat-view-qq-msg")
    // 发送时间
    if (this.block_this.isShowTime && this.dateTime.length > 0) {
      const p = document.createElement('p'); div_msg.appendChild(p); p.classList.add("chat-view-qq-dateTime");
        p.textContent = this.dateTime
    }
    // 发送附属信息
    {
      const div_title = document.createElement('div'); div_msg.appendChild(div_title); div_title.classList.add("chat-view-qq-title")
      const div_title_sub = document.createElement('div'); div_title.appendChild(div_title_sub); div_title_sub.classList.add("chat-view-qq-titlesub")
      // 发送者群头衔
      if (this.groupTitle.length > 0) {
        const p = document.createElement('p'); div_title_sub.appendChild(p); p.classList.add("chat-view-qq-groupTitle");
        p.textContent = this.groupTitle; p.setAttribute("title", this.groupTitle)
      }
      // 发送者群昵称
      if (this.sender.length > 0) {
        const p = document.createElement('p'); div_title_sub.appendChild(p); p.classList.add("chat-view-qq-sender"); p.textContent = this.sender
      }
    }
    // 发送信息内容
    ;(()=>{
      const div_tmp = document.createElement('div'); div_msg.appendChild(div_tmp); div_tmp.setAttribute('style', 'clear: both;')
      if (this.sender.length <= 0) {
        const div_tmp = document.createElement('div'); div_msg.appendChild(div_tmp); div_tmp.setAttribute('style', 'clear: both;')
        return
      }
      const pop = document.createElement('div'); div_msg.appendChild(pop); pop.classList.add('pop')
      // 小尖角
      const shape1 = document.createElement('div'); pop.appendChild(shape1); shape1.classList.add('shape-zero')
      const shape2 = document.createElement('div'); shape1.appendChild(shape2); shape2.classList.add('shape')
      // 全部信息
      const messages_all = document.createElement('div'); pop.appendChild(messages_all); messages_all.classList.add("chat-view-qq-message-all", "word99")

      // b1. md渲染
      if (render_setting.main_setting.isRenderMd) {
        render_setting.fn_renderMarkdown(this.content.join('\n'), messages_all, this.block_this.ctx)
      }
      // b2. 普通渲染
      else {
        let qq_img_re = /!\[\]\((.*?[.jpg|.gif|.png|.webp])\)/
        for (let j=0; j<this.content.length; j++) {
          // 单行信息
          let msg_line = this.content[j]
          const message_line = document.createElement('div'); messages_all.appendChild(message_line); message_line.classList.add("chat-view-qq-message-line")
          let msg_splits = msg_line.split(qq_img_re)
          if (msg_splits.length % 2 == 0) console.warn('【可能产生的错误】正则split分割数复数');
          for (let i=0; i<msg_splits.length; i++) {
            // 分隔后的文字信息
            if (i%2==0) {
              const span = document.createElement('span'); message_line.appendChild(span); span.classList.add("chat-view-qq-message-text"); span.textContent = msg_splits[i]
            }
            // 分隔后的QQ图片/绝对路径图片信息
            else if (/^file:\/\/\//.test(msg_splits[i])) {
              const img = document.createElement('img'); message_line.appendChild(img); img.classList.add("chat-view-qq-message-msg"); img.setAttribute('src', msg_splits[i].replace("file:///", "app://local/"))
            }
            // 网址图片
            else if(/^http/.test(msg_splits[i])) {
              const img = document.createElement('img'); message_line.appendChild(img); img.classList.add("chat-view-qq-message-msg"); img.setAttribute('src', msg_splits[i])
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
              const img = document.createElement('img'); message_line.appendChild(img); img.classList.add("chat-view-qq-message-msg"); img.setAttribute('src', src)
            }
          }
        }
      }
      const div_tmp2 = document.createElement('div'); div_msg.appendChild(div_tmp2); div_tmp2.setAttribute('style', 'clear:both')
    })()
    const div_tmp = document.createElement('div'); bubble.appendChild(div_tmp); div_tmp.setAttribute('style', 'clear:both')
  }

  render_default() {
    const marginClass = this.isContinued ? "chat-view-small-vertical-margin" : "chat-view-default-vertical-margin";
    // const colorConfigClass = `chat-view-${colorConfigs.get(continued ? prevHeader : header)}`;
    // const widthClass = this.block_this.formatConfigs.has("mw") ?
    //   `chat-view-max-width-${this.block_this.formatConfigs.get("mw")}`
    //   : (Platform.isMobile ? "chat-view-mobile-width" : "chat-view-desktop-width");
    const modeClass = `chat-view-bubble-mode-${this.block_this.style}`;
    const headerEl:keyof HTMLElementTagNameMap = "h4"
    /*= formatConfigs.has("header") ?
      formatConfigs.get("header") as keyof HTMLElementTagNameMap :
      "h4";*/
    // 创建div
    let el: HTMLElement = this.block_this.el
    const bubble = document.createElement('div'); el.appendChild(bubble); bubble.classList.add("chat-view-bubble", `chat-view-align-${this.isSelf ? "right" : "left"}`, marginClass/*, colorConfigClass, widthClass*/, modeClass)
    // 创建元素
    if (this.sender.length > 0) {
      const div_tmp = document.createElement('h4'); bubble.appendChild(div_tmp); div_tmp.classList.add("chat-view-header"); div_tmp.textContent = this.sender
    }
    if (this.content[0].length > 0) {
      const div_tmp = document.createElement('p'); bubble.appendChild(div_tmp); div_tmp.classList.add("chat-view-message"); div_tmp.textContent = this.content[0]
    }
    if (this.dateTime.length > 0) {
      const div_tmp = document.createElement('sub'); bubble.appendChild(div_tmp); div_tmp.classList.add("chat-view-subtext"); div_tmp.textContent = this.dateTime
    }
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
