import MarkdownIt from "markdown-it"
import { Chat_webvtt, Chat_original, Chat_qq, Chat_wechat, Chat_telegram, Chat_auto } from "../../Core/codeBlock"

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
  md.use(render_fence)
}
