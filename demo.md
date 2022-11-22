# Chat View QQ 使用示例

**（请使用Obsidian安装该插件后打开）**

## 基本用法

该插件虽然叫 “Chat View **QQ**”，但这只是因为该插件一开始是只是在原插件的基础上加了识别和渲染QQ格式的功能

但后来在其他的的提议下，又适配了其他不同的格式

### QQ 格式

```chat-qq
{self=用户, time=show}
[【作者】LincZero=762699299]

【LV2 群友】用户 1:19:33  
请问这个插件需要怎么使用呢？ 
  
【LV100 群主】【作者】LincZero 1:20:22  
只要将聊天记录直接复制到chat-qq代码框即可，无需任何额外操作与配置，简单易用

新人甲撤回了一条消息

新人乙加入本群。

```

### 微信 格式

windows版复制格式

```chat-wechat
{self=用户}

用户: 
请问这个插件需要怎么使用呢？ 
  
作者 LincZero:
只要将聊天记录直接复制到chat-wechat代码框即可，无需任何额外操作与配置，简单易用

```

mac版复制格式

```chat-wechat
{self=用户, time=show}

用户 2022/11/17 21:07
请问这个插件需要怎么使用呢？

作者 LincZero 2022/11/17 21:08
只要将聊天记录直接复制到chat-wechat代码框即可，无需任何额外操作与配置，简单易用
```

### Telegram 格式

windows版复制格式

```chat-tg
{self=用户}

用户, [2022-11-22 5:05]
请问这个插件需要怎么使用呢？

作者 LincZero, [2022-11-22 5:21]
只要将聊天记录直接复制到chat-wechat代码框即可，无需任何额外操作与配置，简单易用
```

mac版复制格式

``` chat-tg

< 用户:
请问这个插件需要怎么使用呢？

> 作者 LincZero:
只要将聊天记录直接复制到chat-wechat代码框即可，无需任何额外操作与配置，简单易用
```

### 原插件 格式

Chat-View 原插件的格式

```chat
< Fitzwilliam Darcy | Just listen to me, all right? You simply cannot fathom the amount of courage I've had to muster to say this.

# Lizzie gazed at Darcy with a baffled look on her face. Darcy was now sweating profusely. This only unsettled her even more. What was happening?

> Elizabeth Bennett | Mr. Darcy, are you all right? Why did you come here?

...

< Fitzwilliam Darcy | I came here to tell you that I'm in love with you. I'm deeply, unabashedly, utterly in love with you.
```

### Webvtt 格式

Chat-View 原插件的另一种格式，这是一种 **网络视频文本轨道格式**

```chat-webvtt
WEBVTT
Self: John Smith, fjorn@gmail.com
MaxWidth: 70
Header: h3

00:00:00.000 --> 00:01:04.270
<v John Smith>No one touch it, it just works. It is the definition of an absolutely perfect Chat View. Do not defile it! Or else...</v>

00:00:05.790 --> 00:00:06.930
<v John Smith>Going forward, obviously.</v>

00:00:04.310 --> 00:00:04.940
<v Bob Anderson>Uhm?</v>

00:00:04.310 --> 00:00:04.940
<v fjorn@gmail.com>Uhm - would be correct! I have no idea what John is talking about!</v>
```


## （可选）配置操作

### 全局设置

可以在设置菜单中，设置 Chat-qq 的相关设置

也可以在代码框顶部通过 `{}` 和 `[]` 符号进行局部设置。

更推荐进行全局设置

### 指定自己

在全局设置中可以指定多个“己方”，局部设置不能。

由此你可以为你的QQ昵称、微信昵称、或多个不同群的群昵称指定为自己

```chat-wechat
{self=我自己}

我自己: 
这是自己说的话
  
别人:
这是别人说的话

```

### 切换渲染风格

目前支持的渲染风格有：qq、default、minimal

不同各种聊天格式的默认渲染风格为：
- chat-qq: qq
- chat-wechat: qq
- chat-tg: default
- chat: default
- chat-webvtt: default

你也通过 `{style=渲染风格}` 配置来指定，例如：

``` chat-tg
{mode=qq}

< 用户:
请问这个插件需要怎么使用呢？

> 作者 LincZero:
只要将聊天记录直接复制到chat-wechat代码框即可，无需任何额外操作与配置，简单易用
```

### 显示对话时间

```chat-qq
{time=show, self=用户}

【群主】【作者】LincZero 2022-11-17 21:37:26
该功能是今天加的，对应Chat View QQ版本v0.4.4

【群友】用户 21:38:00
好耶好耶好耶好耶好耶好耶好耶

```

### 调整局部宽度与最大高度

```chat-wechat
{width=600, max-height=500}

用户: 
当聊天信息非常长的时候

用户:
设置max-height属性非常有用
  
用户: 
该属性有默认值

用户:
如果不希望有最大高度限制

用户:
可以将值设置为9999

...
...
...
...
...
...
...
...
...
...

```

### 设置QQ头像

> #### 设置QQ头像

使用建议：插件会为每一名用户自动分配默认头像，我也**并不建议**你为所有的聊天记录分配头像，只建议为常用的记录对象在全局设置中进行头像的指定

```chat-qq
[LincZero=762699299]

LincZero 0:00:00
我要使用QQ头像

极少出境的路人甲 0:00:00
我用默认头像就好

极少出境的路人乙 0:00:00
我用默认头像就好
  
极少出境的路人丙 0:00:00
我用默认头像就好

```

> #### 设置微信头像

由于微信API的变动，不能直接获取了（一般需要小程序过去授权）

> #### 设置自定义头像

（见下面 “多种格式图片的使用” 一节）

## 扩展操作

如果仅仅是复制聊天记录并渲染，基本用不上这里的操作。

这里的操作一般用于手写聊天记录

### 多种格式图片的使用

```chat-qq
[LincZero=762699299, 卢曼=demo/卢曼.png, 百度=https://www.baidu.com/img/flexible/logo/pc/result.png]


LincZero 0:00:00
我要使用QQ头像
我希望使用本地图片或QQ复制过来的图片
（由于你QQ文件夹没有这张图片，该图片是不显示的）
![](file:///D:\……\Image\…….png)


卢曼 0:00:00
我希望使用相对路径下的图片
![](demo/卢曼.png)


百度 0:00:00
我希望使用网络上的图片
（但链接中不能有等号，可能以后会修复）
![](https://www.baidu.com/img/flexible/logo/pc/result.png)



```

### 导出为图片

可以在渲染的聊天记录上右键，导出为图片

## 使用技巧

这里介绍一些使用技巧

插件特点：
- 复制即记录，基本无需额外人工修改
- 相较于传统的长截图，有着占用内存低、方便修改内容、方便修改显示的比例的优点

该插件可以很方便地记录：
1. 群友给你的灵感
2. 有自己QQ给自己发信息记录东西习惯的可以用这个来备份
3. 可以用来记录名人名言
4. 不要用来伪造聊天用于其他用途

这里演示一下第三点

```chat-qq
{self=我}
[亚里士多德=demo/亚里士多德.png ,伽利略=demo/伽利略.png, 鲁迅=demo/鲁迅.png,]

亚里士多德 0:00:00
重的物体比轻的物体下落得快

伽利略 0:00:00
错误的，两个铁球同时落地
![](demo/比萨斜塔实验.png)

我 0:00:00
错误的，该课本内容纯属虚构
真实的是：伽利略没有做过比萨斜塔实验
再次强调：不要伪造聊天记录

鲁迅 0:00:00
特别是不要伪造我说的话
———《我确实没说过》
```



