import MarkdownIt from "markdown-it"
import { render_setting } from "../Core/render"
import { Chat_webvtt, Chat_original, Chat_qq, Chat_wechat, Chat_telegram, Chat_auto } from "../Core/codeBlock"

interface Options {
  multiline: boolean;
  rowspan: boolean;
  headerless: boolean;
  multibody: boolean;
  autolabel: boolean;
}

/**
 * 渲染 - codeBlock/fence 规则
 */
function render_fence(md: MarkdownIt, options?: Partial<Options>): void {
  const oldFence = md.renderer.rules.fence || function(tokens:any, idx:any, options:any, env:any, self:any) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = (tokens:any, idx:any, options:any, env:any, self:any) => {
    // 查看是否匹配
    let token = tokens[idx]
    let lines = token.content.split('\n')
    const codeBlockType = token.info.toLowerCase() as string
    if (!['chat-webvtt', 'chat-old', 'chat', 'chat-qq', 'chat-wechat', 'chat-tg'].includes(codeBlockType)) { return oldFence(tokens, idx, options, env, self) }

    const el: HTMLDivElement = document.createElement('div'); el.classList.add("cv-note");
    if (codeBlockType == 'chat-webvtt') { new Chat_webvtt(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-old') { new Chat_original(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat') { new Chat_auto(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-qq') { new Chat_qq(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-wechat') { new Chat_wechat(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-tg') { new Chat_telegram(token.content, el, null, this).render() }
    else { console.error('error: 不可能到达此处') }

    return el.outerHTML
  }
}

export default function mdit_cv(md: MarkdownIt, options?: Partial<Options>): void {
  // 定义默认渲染行为
  render_setting.fn_renderMarkdown = (markdown: string, el: HTMLElement): void => {
    el.classList.add("markdown-rendered")
    const result: string = md.render(markdown)
    const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
  }
  render_setting.registerContextMenu = ()=>{}

  // 插件配置
  render_setting.main_setting = { // DEFAULT_SETTINGS
    chatSelfName: '我, me',
    chatQQandName: '马化腾=10001, 李宗桦=10101',
    width: '100%',
    maxHeight: '1100',
    isRenderMd: true,
    isPcStyle: true,
  }
  if (render_setting.main_setting.width) document.documentElement.style.setProperty('--qq-width',
  Number.isFinite(Number(render_setting.main_setting.width)) ? render_setting.main_setting.width+'px' : render_setting.main_setting.width)
  if (render_setting.main_setting.maxHeight) document.documentElement.style.setProperty('--qq-max-height',
  Number.isFinite(Number(render_setting.main_setting.maxHeight)) ? render_setting.main_setting.maxHeight+'px' : render_setting.main_setting.maxHeight)

  if (render_setting.main_setting.isPcStyle) { document.body.classList.add('pc-chat') } // 电脑风格
  else { document.body.classList.remove('pc-chat') } // 手机风格

  md.use(render_fence)
}
