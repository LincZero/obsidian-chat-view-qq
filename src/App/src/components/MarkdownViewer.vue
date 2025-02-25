<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import mdit_cv from "../index_mdit"

const props = defineProps<{
  mdData: any
}>()

// 渲染方法
import MarkdownIt from "markdown-it";
const md = MarkdownIt()
md.use(mdit_cv) // 使用插件
function fn_renderMarkdown(markdown: string, el: HTMLElement, ctx?: any): void {
  if (!el) return;
  el.classList.add("markdown-rendered"); el.innerHTML = ''

  const result: string = (md as MarkdownIt).render(markdown)
  const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
}

// 绑定事件
const ref_markdownViewer = ref<HTMLElement | null>(null)
watch(() => props.mdData.string, (newVal)=>{
  if (!ref_markdownViewer.value) return
  fn_renderMarkdown(newVal, ref_markdownViewer.value)
})
onMounted(()=>{
  nextTick().then(() => {
    if (!ref_markdownViewer.value) return
    fn_renderMarkdown(props.mdData.string, ref_markdownViewer.value)
  })
})
</script>

<template>
  <div class="ab-app-render" ref="ref_markdownViewer"></div>
</template>

<style lang="scss" scoped>
.ab-app-render {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  margin: 0;

  padding: 10px 20px 500px;
  overflow: auto;

  >div.ab-note { // ob和vuepress版本外面有一层，但这里没有，要给间距
    margin: 26px 0;
  }
}
</style>

<style>
/** 一些markdown样式校正 */
.ab-app-render ul {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}
.ab-app-render table {
  display: table;
  width: 100%;
  border-collapse: collapse;
}
.ab-app-render th, .ab-app-render td {
  border: solid 1px currentColor;
  padding: 0 4px;
}
.ab-app-render h2 {
  color: #ffc078;
}
.ab-app-render strong {
  color: red;
}
.ab-app-render em {
  color: yellow;
}
.ab-app-render s {
  color: gray;
}
</style>
