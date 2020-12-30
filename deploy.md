# 部署说明
## ⚠️
MacOS Catalina 10.15以上版本无法打exe安装包
https://github.com/electron-userland/electron-builder/issues/4305
## 客户端打包
0. 设置后台服务器地址,生成环境默认使用.env.out环境,修改其中`VUE_APP_API_URL`即可
1. 打包客户端程序
```js
  // client
  cnpm i  // 建议不要使用npm i 容易鬼畜安装失败
  npm run build // 根据本地系统自动打包相应安装包 (windows则会打成exe,mac则为dmg)
  npm run build:win32 // win32版本
  npm run build:win64 // win64版本
  // 更多参数命令参考官网 https://www.electron.build/cli
  Building:
  --mac, -m, -o, --macos   Build for macOS, accepts target list (see
                           https://goo.gl/5uHuzj).                       [array]
  --linux, -l              Build for Linux, accepts target list (see
                           https://goo.gl/4vwQad)                        [array]
  --win, -w, --windows     Build for Windows, accepts target list (see
                           https://goo.gl/jYsTEJ)                        [array]
  --x64                    Build for x64                               [boolean]
  --ia32                   Build for ia32                              [boolean]
  --armv7l                 Build for armv7l                            [boolean]
  --arm64                  Build for arm64                             [boolean]
  --dir                    Build unpacked dir. Useful to test.         [boolean]
  --prepackaged, --pd      The path to prepackaged app (to pack in a
                           distributable format)
  --projectDir, --project  The path to project directory. Defaults to current
                           working directory.
  --config, -c             The path to an electron-builder config. Defaults to
                           `electron-builder.yml` (or `json`, or `json5`), see
                           https://goo.gl/YFRJOM

```
2. 客户端安装
## 数据库配置
1. 创建名为 `chat` 的数据库
2. 配置后端 `app.module.ts` 中的 mysql 账号密码
```js
// /server/src/app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      port: 3306,
      username: 'root', // 默认账号
      password: '123456', // 默认密码
      database: 'chat',
      charset: "utf8mb4",
      autoLoadEntities: true,
      synchronize: true
    }),
  ],
})
```

## 部署后端服务

**后台服务默认端口号为`3000`有需要自行修改 main.ts文件**
- 方式一(整个项目拷贝至服务器)
  1. 安装 pm2
  ```js
  npm i pm2 -g
  ```
  2. 生成 dist 文件
  ```js
  npm i
  npm run build
  ```
  3. 使用 pm2 运行
  ```js
  npm run pm2
  ```
- 方式二(结合ncc打包,便于离线环境下部署)
  1. 本地执行`npm run pkg`
  2. 拷贝`deploy`文件夹至服务器
  3. 服务器上运行
  ```js
    node deploy/index 或者 pm2 deploy/index
  ```

  ## 其他注意事项

  - 如果在CentOS上部署出现libc.so.6版本过低,考虑是系统环境问题,升级版本

  - 后端服务器注意安全策略中放行`3000`端口

  - 加qq群..