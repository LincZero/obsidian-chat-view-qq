English | [中文](./README_zh.md)

**English version is machine translated**

## Descriptions

==This plugin is for the convenience of recording chat records. Do not use it for fake chat records or criminal purposes==

Supported Format：
- qq
- wecaht (win & mac)
- telegram (win & mac)
- webvtt

Obsidian Plugin，The magic changes to [obsidian-chat-view](https://github.com/adifyr/obsidian-chat-view)
We have done a lot of work that is more suitable for Chinese use, such as qq/wechat format, intelligent avatar, intelligent recognition format and so on.

`version-by` is the [obsidian-chat-view](https://github.com/adifyr/obsidian-chat-view) version on which the magic is based<br/>
`version` the revised edition

```json
{
	"id": "obsidian-chat-view-qq",
	"name": "Chat View QQ",
	"version-by": "1.2.1",
	"version": "0.5.0",
	"minAppVersion": "0.15.0",
	"description": "The magic changes to obsidian-chat-view。It can directly copy the information in the chat records of QQ and other platforms, and automatically render the chat interface",
	"author": "LincZero | Aditya Majethia",
	"isDesktopOnly": false
}
```

## Use Examples

==The functions of the original plug-in are retained. See  [obsidian-chat-view](https://github.com/adifyr/obsidian-chat-view) for the functions of the original plug-in。Here is only to demonstrate the new features after the magic change==<br/>
==See the [demo.md](./demo.md) file for other formats and more extensions==

method of application：<br/>

QQ

````md
```chat-qq
{self=SelfName, width=Local render width, max-height=Local maximum render height, time=show # Whether to display the time}
[user1=user1 QQ, user2=user2 QQ, user3=user3 QQ]

【Group Title】user1 2022-11-11 18:38:25  
msg1

user2 10:38:43  
msg2  
  
user3加入本群。  
  
user3 10:51:31  
Hello

...

```
````

WeChat

````
```chat-wechat
{self=LincZero}

LincZero:
666

LincZero:
[emoji]
```
````

效果：（V0.3.3 new Style）

![img](assets/665IOT2Z[GG{QFY$0M2A}G.png)

## Plug-in Features

- Copying is recording without too much manual modification
  - It also retains many optional customization options
- Compared with the traditional long screenshot, it has the advantages of low memory consumption, convenient modification of the content and convenient modification of the display ratio
- It can be easily recorded：
  - Your friends give you inspiration
  - Have their own QQ to send their own information to record things can use this to back up
  - It can be used to record famous quotes
  - Don't use it to fake chat for bad purposes

## Update Logs

### 1.3.0（20250223）

此处不再维护 Update Logs，具体更新详情见 Github 的 Releases 页

> [!note]
> 
> 关于之前的停更说明：
> 
> (1) 旧版QQ以前是比较方便的，直接拖拽选择一堆对话，然后复制黏贴到ob里就完事了。这也使得该插件可以非常轻松地记录信息
> 操作量为3 (拖拽 Ctrl+C Ctrl+V)
> 
> (2) **后来有非常长一段时间没有进行更新**，主要是因为自从QQ推出**NT版本**后，消息难以直接复制黏贴。
> 而该插件又主要是针对QQ信息进行特化的，新版本QQ无法很方便地进行复制，导致插件用起来非常难受。作者本人也不用了，所以放弃维护……
> NT版QQ操作量增加为9! (拖拽 点收藏 点收藏界面 点击刚刚收藏的对话 拖拽 复制 黏贴 关闭 关闭)
> (如果你还要把收藏给删了，操作量就是11了! )
> 这是完全不可接受的
> 
> (3) QQ NT版本在过了数年后……才把这个功能费搞了回来
> 2025-02-15 补充： **更新到版本: 9.9.17-31363 (64位) 及以上，又能拖拽选择一堆对话，然后复制黏贴啦！**
> 希望后面不要再把这个功能给删了......真的气人

### v0.5.0（20221122）

重构了 项目，面向对象重构的方式，使代码的可扩展性更好（大改）

修复了 mac设备复制的聊天记录格式不对的问题

新增了 Telegram格式的支持

### v0.4.4（20221117）

新增了 群头衔和信息时间的渲染

修改了 源文件一些变量名称

### v0.4.3（20221117）

新增了 允许使用多种图片（包括相对路径图片）作为聊天头像和聊天图片。详见demo.md

### v0.4.2（20221115）

新增了 右键菜单，可以将渲染的聊天记录转为图片并保存到剪切板

修复了 QQ聊天记录中带有日期和群头衔情况的正则匹配错误问题

### v0.4.1（20221110）

新增了 支持微信聊天记录的复制

新增了 可以同时指定多个self（己方对象，但只能在设置菜单里设置）

修改了 项目结构，拆分出多个文件，更模块化，更利于后期维护


### v0.4.0（20221109）

新增了 全局设置，可以设置自己的昵称和常用的聊天对象的QQ头像。<br>支持全局设置和局部独立设置

修复了 聊天记录中数字和英文长度过场时换行失败的bug

修复了 多行信息不换行而是用空格间隔开的bug


### v0.3.6（20221107）

修复了 聊天记录中emoji的向左浮动的bug

新增了 指令：`{max-height:400}`（不要加px），默认值1000，当信息长度超出后会滚动显示，99999为不设置


### v0.3.5（20221105）

新增了 图片显示的支持

修复了 预览模式下不显示的问题，但仍未解决所有bug（`&nbsp;`字符）

样式有细微改良


### v0.3.3（20221105）

新增了 根据主题切换样式

新增了 指令：`{width:800}`（不要加px），能设置渲染的聊天记录的宽度

新增了 不指定QQ时使用默认头像

修复了 消息过短或过长时，样式会出现bug


### v0.3（20221104）

新增了 仿QQ样式。但为了适配样式，修改了html元素结构，不兼容旧版


### v0.2（20221104）

新增了 指令：`{slef:自己的名字}`，头像指定QQ，指定自己的功能


### v0.1（20221104）

修复了 发送的消息不能换行（原插件不支持多行信息）

初始版本，只有最基础的功能，能识别QQ复制过来的聊天记录


### 当前版本已知bug和待新增功能

待新增功能：

- 图片本地化（插入本地图片）
- 代码着色，区分人和对话（不知道能不能做到）
- 根据头像选区主题色，对对话框进行着色
- 引用块的渲染

已知bug：

- 会影响正则判断的问题
  - 不能取一些奇奇怪怪的群昵称
  - 不要发送奇奇怪怪的内容，比如发送日期（复制的记录有歧义，无解）
  - 不要和其他群友起一样的名字，分辨不出来（复制的记录有歧义，无解）
- 腾讯字体加载错误，所以目前的字体会有点奇怪





