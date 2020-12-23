/*
 * @file: main.ts
 * @author: BoBo
 * @copyright: NanJing Anshare Tech .Com
 * @Date: 2020-12-04 10:25:20
 */


// 用于支持TypeORM
import {
  app, protocol, BrowserWindow, Menu, MenuItemConstructorOptions, globalShortcut,
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

const isProduction = process.env.VUE_APP_PKG === 'pro';

// 保持一个对于window对象的全局引用，不然当JavaScript被GC，window会被自动地关闭
let win: BrowserWindow | null;

// 必须在app准备好之前注册Scheme
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

function createWindow() {
  console.log(1);
  // 创建浏览器窗口
  win = new BrowserWindow({
    icon: './deployment/icons/icon.ico',
    width: 1280,
    minWidth: 800,
    minHeight: 600,
    height: 780,
    resizable: true, // 可否缩放
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // 是否启动dev server
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // 开发模式加载dev server的地址
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    // 打开调试工具
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // 非开发模式加载index.html
    win.loadURL('app://./index.html');
    // 非生成模式打开调试工具
    if (!isProduction) {
      win.webContents.openDevTools();
    }
  }
  // 窗口关闭回调
  win.on('closed', () => {
    // 清空全局引用的window对象
    win = null;
  });
}

// 设置菜单栏
function createMenu() {
  // darwin表示macOS，针对macOS的设置
  if (process.platform === 'darwin') {
    const template: Array<MenuItemConstructorOptions> = [
      {
        label: '帮助',
        submenu: [
          {
            role: 'about',
          },
          {
            role: 'quit',
          },
        ],
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else if (isProduction) {
    // 生产模式隐藏菜单栏
    Menu.setApplicationMenu(null);
  }
}
// 设置菜单栏
createMenu();
// 所有窗口关闭时推出
app.on('window-all-closed', () => {
  // 在macOS上应用程序的菜单栏保持活动状态直到用户使用Cmd+Q显式退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});

// Electron初始化完成准备创建浏览器窗口，一些API从此允许使用
app.on('ready', async () => {
  if (!isProduction && !process.env.IS_TEST) {
    // Vue Devtools不支持Electron 6.0.0及以上版本，https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378
    // 等将来官方说可以玩了再放开以下注释
    // try {
    //   await installVueDevtools()
    // } catch (e){
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  // 在开发环境和生产环境均可通过快捷键打开devTools
  globalShortcut.register('CommandOrControl+Shift+i', () => {
    if (win) {
      win.webContents.openDevTools();
    }
  });

  createWindow();
});

// 在开发模式中，父进程可以请求退出此程序
if (!isProduction) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
