import MarkdownIt from "markdown-it"
import { render_setting } from "../Core/render"
import { Chat_original, Chat_qq, Chat_wechat, Chat_telegram, Chat_auto } from "../Core/codeBlock"

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
    // if (codeBlockType == 'chat-webvtt') { new Chat_webvtt(token.content, el, null, this).render() } // 有bug，且需要 node-webvtt 库，vuepress版本不使用
    if (codeBlockType == 'chat-old') { new Chat_original(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat') { new Chat_auto(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-qq') { new Chat_qq(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-wechat') { new Chat_wechat(token.content, el, null, this).render() }
    else if (codeBlockType == 'chat-tg') { new Chat_telegram(token.content, el, null, this).render() }
    else { console.error('error: 不可能到达此处') }

    // url修正 (不修正的话，嵌套相对链接会导致编译报错)
    // 原来的正常流程：img在 mdit img parse 阶段，路径替换就已经完成了
    // 现在的流程补充：现在局部的img实际上走的是 md.render()，虽然应该也是走parse-render流程，但可能是由于缺少env? 反之没有路径调整这部分的处理，这里补上
    // demo: src="./assets/abc.png" -> src="@source/MdNote_Public/Guide/assets/abc.png"
    let ret = el.outerHTML
    if (env.filePathRelative) {
      const rootPath:string = env.filePathRelative.substring(0, (env.filePathRelative.lastIndexOf('/')??0)+1); // 'MdNote_Public/Guide/README.md' -> '@source/MdNote_Public/Guide/'
      // img
      ret = ret.replace(/<img src="(\.[^"]+)"/g, (match, relativePath) => { // 可能的bug：/<img [^>]*src="(\.[^"]+)"[^>]*>/g 这个匹配严格一点，但弄起来很麻烦。先假设mdit的img的src属性必在最前面
        const absoluteUrl:string = "@source/" + rootPath + relativePath;
        return `<img src="${absoluteUrl}"`;
      })
      // link
      ret = ret.replace(/<routelink to="([^"]+)">([^<]*)<\/routelink>/g, (match, relativePath, linkContent) => {
        let absoluteUrl:string = ""
        // example: (`/` or `/org1/`) + (`/xxx/` or `xxx/`)
        if (env.base) absoluteUrl += env.base
        else absoluteUrl += "/"
        if ((relativePath as string).startsWith("/")) absoluteUrl += (relativePath as string).slice(1)
        else absoluteUrl += rootPath + relativePath;
        return `<a class="route-link" href="${absoluteUrl}">${linkContent}</a>`;
      })
    }

    return ret
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
    chatSelfName: '我, me, user',
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
