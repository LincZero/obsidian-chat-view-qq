import {App, Menu, Editor, MarkdownView, Point} from 'obsidian';
import {Notice} from 'obsidian'

var domtoimage = require('dom-to-image');

// 尝试加入右键事件 @TODO：开发测试
  /*this.registerEvent(
    this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
      new Notice("正在添加菜单项")
      console.log("正在添加菜单项")
    })
  );*/
  
// 给element注册事件
export function registerContextMenu(codeBlock_this: any){
  let main_this: any = codeBlock_this.main_this
  let el: HTMLElement = codeBlock_this.el
  
  el.oncontextmenu = (e)=>{
    e.preventDefault() // 不然新的菜单不弹出
    
    // let menu = new Menu(main_this.app)，不加构造参数也可以
    let menu = new Menu()
    menu.addItem((item)=>{
      const itemDom = (item as any).dom as HTMLElement;
				itemDom.addClass("type-enhance-menu");
				item
						.setTitle("导出图片到剪切板")
            .setIcon("clipboard-copy")
            .onClick(() => {
              f_domtoimage(el, main_this.document)
            })
    })
    menu.addItem((item)=>{
      const itemDom = (item as any).dom as HTMLElement;
				itemDom.addClass("type-enhance-menu");
				item
						.setTitle("将引用图片转为本地")
            .setIcon("folder-input")
            .onClick(async () => {
              new Notice("（该功能正在开发中）")
            })
    })
    menu.showAtMouseEvent(e)
  }
}

  // dom转图片
function f_domtoimage(bubble: HTMLElement, d: Document){
  new Notice("正在生成图片")

  // 获取PNG图像base64编码
  /*domtoimage.toPng(bubble)
  .then(function (dataUrl: any) {
      var img = new Image();
      img.src = dataUrl;
      //bubble.createEl("img", {
      //  attr: {"src": img.src}
      //})
      // window.atob(img.src)
      new Notice("转化图片成功1")
  })
  .catch(function (error: Error) {
      console.error('oops, something went wrong!', error);
  });*/

  // 获取PNG图像blob并下载它
  domtoimage.toBlob(bubble)
  .then(function (blob: any) {
    // window.saveAs(blob, 'my-node.png');

    // ClipboardItem api 火狐不兼容，能用但这里会报错，很烦
    const clipboardItemInput = new window.ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([clipboardItemInput])
      .then(
        () => {
          console.log("Copied to clipboard successfully!");
        },
        () => {
          console.error("Unable to write to clipboard.");
        }
      );
    new Notice("已将图片复制到剪切板")
  })
  .catch(function (error: Error) {
    new Notice("图片生成失败")
    console.error('oops, something went wrong!', error);
  }); 

  // 保存并下载压缩的 JPEG 图像
  /*domtoimage.toJpeg(bubble, { quality: 0.95 })
    .then(function (dataUrl: any) {
      var link = d.createElement('a');
      link.download = 'my-image-name.jpeg';
      link.href = dataUrl;
      link.click();
      new Notice("转化图片成功3")
    });*/
  
}