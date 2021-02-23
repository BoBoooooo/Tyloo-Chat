/*
 * @file: 消息通知模块
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2021-02-01 12:30:18
 */


const win = require('electron').remote.getCurrentWindow();
const { app } = require('electron');

export default function (title: string, body: string) {
  // 窗口最小化时好友消息推送
  if (win.isMinimized()) {
    const myNotification = new window.Notification(title, {
      body,
    });
    myNotification.onclick = () => {
      win.restore();
    };
  }
}
