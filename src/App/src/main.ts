import { createApp } from 'vue';
import App from './App.vue';
import MarkdownIt from "markdown-it"

import { render_setting } from "../../Core/render"

// 定义默认渲染行为
const md = MarkdownIt()
render_setting.fn_renderMarkdown = (markdown: string, el: HTMLElement): void => {
	el.classList.add("markdown-rendered")
	
	const result: string = md.render(markdown)
	const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
}
render_setting.registerContextMenu = ()=>{}
render_setting.main_setting = { // DEFAULT_SETTINGS
	chatSelfName: '我, me',
	chatQQandName: '',
	width: '100%',
	maxHeight: '1100',
	isRenderMd: true,
	isPcStyle: true,
}

// 插件配置
if (render_setting.main_setting.width) document.documentElement.style.setProperty('--qq-width',
	Number.isFinite(Number(render_setting.main_setting.width)) ? render_setting.main_setting.width+'px' : render_setting.main_setting.width)
if (render_setting.main_setting.maxHeight) document.documentElement.style.setProperty('--qq-max-height',
	Number.isFinite(Number(render_setting.main_setting.maxHeight)) ? render_setting.main_setting.maxHeight+'px' : render_setting.main_setting.maxHeight)

if (render_setting.main_setting.isPcStyle) { document.body.classList.add('pc-chat') } // 电脑风格
else { document.body.classList.remove('pc-chat') } // 手机风格

createApp(App).mount('#app');
