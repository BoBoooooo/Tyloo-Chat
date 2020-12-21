# Tyloo-Chat(仿wechat)
[![author](https://img.shields.io/badge/author-BoBoooooo-blue.svg)](https://github.com/BoBoooooo)
[![author](https://img.shields.io/github/languages/top/BoBoooooo/tyloo-chat)](https://github.com/BoBoooooo/tyloo-chat)
[![Node.js Version](https://img.shields.io/badge/node.js-10.16.3-blue.svg)](http://nodejs.org/download)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/BoBoooooo/tyloo-chat/LICENSE)
[![author](https://img.shields.io/github/stars/BoBoooooo/tyloo-chat?style=social)](https://github.com/BoBoooooo/tyloo-chat)

## 说明
本项目fork自[genal-chat]('https://github.com/genaller/genal-chat.git')做了优化升级,感谢大佬`Genal`开源提供思路!
由于年底比较忙,目前还在抽空持续优化中,敬请期待~
之后会考虑出electron的版本

## [Tyloo-Chat线上demo地址](http://server.boboooooo.top:9999)
**tips: 麻烦各位绿色聊天,不要开车,不要上传太大的文件,服务器比较垃圾..**

## 部分功能截图
- 整体界面
![](./assets/demo1.png)
- 通讯录
![](./assets/demo2.png)
- 群聊功能(群成员列表,在线状态,支持添加群成员)
![](./assets/demo3.png)
- 会话列表(置顶/删除)
![](./assets/demo5.png)
- 消息撤回功能
![](./assets/demo4.png)
## Feature
- 用户登陆注册 (支持单点登陆)
- 群聊 (类似qq群)
    - 邀请好友加入群聊
    - 修改群名/群公告
- 好友功能 (支持接入第三方组织架构直接发起私聊)
- 通讯录功能
- 聊天功能
    - Emoji表情包
    - 图片发送/图片预览
    - 支持发送附件
    - 消息分页
    - 消息撤回/复制
- 自定义主题
- 会话置顶/删除
- 重连提醒
- **智能助手(默认,位于 main分支)**
- **第三方API机器人(可选,位于feature_APIROBOT分支)**

## Tech Stack
- **Typescript**：JavaScript 的一个超集，它最大的优势是提供了类型系统和提高了代码的可读性和可维护性。
- **Vue2.6.x**：前端渐进式框架。
- **Socket/io**：实现实时通信，websocket第三方库。
- **Vuex**：状态管理。
- **Nestjs**：是一个用于构建高效、可扩展的 Node.js 服务端应用框架，基于 TypeScript 编写并且结合了 OOP1、FP2、FRP3 的相关理念。
- **Typeorm**: 支持最新的 JavaScript 特性并提供额外的特性以帮助你开发任何使用数据库的应用程序。
- **ES6+**：采用ES6+语法，箭头函数、async/await等等语法很好用。
- **SASS(SCSS)**：用SCSS做CSS预处理语言，可以使用最高效的方式，以少量的代码创建复杂的设计。
- **ElasticSearch** Elasticsearch是一个基于Lucene的搜索服务器。它提供了一个分布式多用户能力的全文搜索引擎，基于RESTful web接口。
- **[Nodejieba](https://github.com/yanyiwu/nodejieba)** node版本中文分词器

## 数据库表结构设计
![](./assets/database.png)

## 环境准备
- mysql
- chat数据库 (需要手动创建,注意数据库编码格式为utf8bm64)
- node v10.16.3

## 运行项目
```js
// client
cd client 
npm i
npm start
```

```js
// server
cd server
npm i
npm run start
```

## 如何部署

[Deploy](./deploy.md)

## 思路概述

[webSocket建立流程](./webSocket建立流程.md)

## TODO
- `@功能实现`
- `消息转发`
- `代码性能优化`
- `群聊功能继续完善`
