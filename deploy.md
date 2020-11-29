# 部署说明
## 部署前端服务
1. 打包前端文件生成 dist 文件夹
```js
  // client
  npm i
  npm run build 
```
1. 将 dist 下所有文件放到 nginx 下的 html 文件夹中
2. 配置 nginx 的 gzip (提高传输速度)和请求级别
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
    server_name  www.genal.fun;
    location / {
      root   html;
      index  index.html index.htm;
      add_header Cache-Control public;
    }

    location ^~/api/ {
      rewrite ^/api/(.*) /$1 break;
      proxy_pass http://localhost:3000;
    }

    location ^~/socket.io/ {
      proxy_pass http://localhost:3000;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
  }  
}
```
3. nginx -s reload

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