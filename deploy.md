# 部署说明
- 部署策略采用前后端分离部署,后端采用CORS解决跨域问题
- **请先切换`feature_APIROBOT`分支进行部署**

## 前端部署
1. 修改.env.out环境变量中的`VUE_APP_API_URL`地址为你的服务器地址
  ```js
  VUE_APP_API_URL=http://xxx.xxx.xxx.xxx:3000
  ```
2. 构建前端包
```js
  // client
  cnpm i
  npm run build
```
3. 将 dist 下所有文件放到 nginx 下的 html 文件夹中 (或者是其他http服务器的对应目录下)
4. nginx conf
```js
// nginx.conf
http {
  #避免mime类型丢失导致css样式无法正常加载
  include mime.types;
  #nginx开启gzip
  #前端文件在build的时候已经配置好压缩,需要再配置一下nginx;
  gzip on; 
  gzip_static on;
  gzip_buffers 4 16k;
  gzip_comp_level 5;
  gzip_types text/plain application/javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg 
              image/gif image/png;
  
  #nginx请求级别配置
  server {
    listen       80;
    server_name  www.server.com;
    location / {
      root   html;
      index  index.html index.htm;
      add_header Cache-Control public;
    }
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$
    {
        expires      30d;
    }

    location ~ .*\.(js|css)?$
    {
        expires      12h;
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
  }  
}
```
5. nginx -s reload

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