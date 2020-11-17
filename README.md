# Tyloo聊天室
[![author](https://img.shields.io/badge/author-BoBoooooo-blue.svg)](https://github.com/BoBoooooo)
[![author](https://img.shields.io/github/languages/top/BoBoooooo/tyloo-chat)](https://github.com/BoBoooooo/tyloo-chat)
[![Node.js Version](https://img.shields.io/badge/node.js-10.16.3-blue.svg)](http://nodejs.org/download)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/BoBoooooo/tyloo-chat/LICENSE)
[![author](https://img.shields.io/github/stars/BoBoooooo/tyloo-chat?style=social)](https://github.com/BoBoooooo/tyloo-chat)

## 功能介绍
- 移动端兼容
- 用户信息的修改(头像/用户名/密码)
- 群聊/私聊
- 创建群/加入群/退群/模糊搜索群
- 添加好友/删好友/模糊搜索用户
- 消息分页
- 表情包
- 图片发送/图片预览
- 在线人数统计
- 自定义主题
- 重连提醒

## 技术概览
- **Typescript**：JavaScript 的一个超集，它最大的优势是提供了类型系统和提高了代码的可读性和可维护性。
- **Vue2.6.x**：前端渐进式框架。
- **Socket/io**：实现实时通信，websocket第三方库。
- **Vuex**：状态管理。
- **Nestjs**：是一个用于构建高效、可扩展的 Node.js 服务端应用框架，基于 TypeScript 编写并且结合了 OOP1、FP2、FRP3 的相关理念。
- **Typeorm**: 支持最新的 JavaScript 特性并提供额外的特性以帮助你开发任何使用数据库的应用程序。
- **ES6+**：采用ES6+语法，箭头函数、async/await等等语法很好用。
- **SASS(SCSS)**：用SCSS做CSS预处理语言，可以使用最高效的方式，以少量的代码创建复杂的设计。

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
npm run serve
```

```js
// server
cd server
npm i
npm run start:dev
```

## 部署
[deploy](./deploy.md)

## 更多细节
[用typescript打造一个性能强悍的web聊天室](https://github.com/genaller/strong-frontend/blob/master/learnNode/nest/%E8%81%8A%E5%A4%A9%E5%AE%A4/%E7%94%A8typescript%E6%89%93%E9%80%A0%E4%B8%80%E4%B8%AA%E6%80%A7%E8%83%BD%E5%BC%BA%E6%82%8D%E7%9A%84web%E8%81%8A%E5%A4%A9%E5%AE%A4.md)

## 感谢

感谢大佬Genal开源项目提供思路!
[genal-chat]('https://github.com/genaller/genal-chat.git') 
