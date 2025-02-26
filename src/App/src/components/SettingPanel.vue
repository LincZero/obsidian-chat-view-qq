<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { render_setting } from '../../../Core/render'

const props = defineProps<{
  mdData: any
}>()

// 插件配置修改
async function handleInputChange() {
  await nextTick() // 注意 @input 先于 v-model 执行，有问题。要用@change代替。然后再用个nextTick来上个保险

  if (render_setting.main_setting.width) document.documentElement.style.setProperty('--qq-width',
    Number.isFinite(Number(render_setting.main_setting.width)) ? render_setting.main_setting.width+'px' : render_setting.main_setting.width)
  if (render_setting.main_setting.maxHeight) document.documentElement.style.setProperty('--qq-max-height',
    Number.isFinite(Number(render_setting.main_setting.maxHeight)) ? render_setting.main_setting.maxHeight+'px' : render_setting.main_setting.maxHeight)

  if (render_setting.main_setting.isPcStyle) { document.body.classList.add('pc-chat') } // 电脑风格
  else { document.body.classList.remove('pc-chat') } // 手机风格

  // 仅限app的设置项
  if (fontSize.value) {
    document.documentElement.style.setProperty('--qq-font-size', fontSize.value)
  }
  if (iconSize.value) {
    document.documentElement.style.setProperty('--qq-width-icon', 'calc(' + iconSize.value + ' + 25px)')
  }
  if (isDark.value) {
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add('theme-dark');
  } else {
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.classList.add('theme-light');
  }

  // 最好需要强制刷新一下MdViewer的内容。这里比较粗糙简易
  props.mdData.string = props.mdData.string + ' '
}

const fontSize = ref('')
const iconSize = ref('')
const isDark = ref(true)
</script>

<template>
  <div class="ab-app-setting">
    <div>
      <label for="width">宽度</label>
      <input id="width" v-model="render_setting.main_setting.width" @change="handleInputChange()">
    </div>
    <div>
      <label for="maxHeight">最大高度</label>
      <input id="maxHeight" v-model="render_setting.main_setting.maxHeight" @change="handleInputChange()">
    </div>
    <div>
      <label for="self-name">自己的名字</label>
      <input id="self-name" v-model="render_setting.main_setting.chatSelfName" @change="handleInputChange()">
    </div>
    <div>
      <label for="name-qq">名称对应的QQ号</label>
      <input id="name-qq" v-model="render_setting.main_setting.chatQQandName" @change="handleInputChange()">
    </div>
    <div>
      <label for="is-render-md">是否将内容以md形式渲染</label>
      <input id="is-render-md" type="checkbox" v-model="render_setting.main_setting.isRenderMd" @change="handleInputChange()">
    </div>
    <div>
      <label for="is-pc-style">是否为电脑风格</label>
      <input id="is-pc-style" type="checkbox" v-model="render_setting.main_setting.isPcStyle" @change="handleInputChange()">
    </div>
    <!-- app模式特供版 -->
    <div>
      <label for="is-dark">黑暗模式</label>
      <input id="is-dark" type="checkbox" v-model="isDark" @change="handleInputChange()">
    </div>
    <div>
      <label for="lightdark">字体大小</label>
      <input id="lightdark" v-model="fontSize" @change="handleInputChange()" placeholder="16px">
    </div>
    <div>
      <label for="icon-size">头像大小</label>
      <input id="icon-size" v-model="iconSize" @change="handleInputChange()" placeholder="55px">
    </div>
    <div>
      <label>更多渲染风格/动态显示 (未开发，敬请期待)</label>
    </div>
    <div>
      <label>强制显示时间 (未开发，默认是当天不显示，隔天才显示)</label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ab-app-setting {
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  >div {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    > label {
      min-width: 150px;
    }
    > input {
      flex: 1;
    }
    > input[type="checkbox"] {
      text-align: right;
    }
  }
}
</style>
