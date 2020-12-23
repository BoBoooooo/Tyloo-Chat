const webpack = require('webpack');


module.exports = {
  configureWebpack: (config) => {
    // 不打包moment的语言包
    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));
    // 去除console
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-param-reassign
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    }
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            'primary-color': '#09b955',
            // 'link-color': '#1DA57A',
            // 'border-radius-base': '2px',
          },
          javascriptEnabled: true,
        },
      },
      sass: {
        prependData: "@import '@/styles/index.scss';",
      },
    },
  },
  publicPath: './',
  devServer: {
    port: 1997,
    // electron版本直接请求后台服务,不作反向代理
  },
  productionSourceMap: false,
  pluginOptions: {
    // vue-cli-plugin-electron-builder配置项
    // https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html
    electronBuilder: {
      // 前端资源编译输出路径，实际输出到./dist/bundled
      outputDir: './dist',
      // 主进程入口文件，根据electron架构，入口文件存放在main文件夹。
      mainProcessFile: './src/main/background.ts',
      // 官方文档：https://www.electron.build/configuration/configuration
      builderOptions: {
        // 安装包相关信息
        appId: 'cn.com.bobo.tyloochat',
        productName: 'TylooChat',
        copyright: 'Copyright © BoBo',
        directories: {
          // electron资源编译输出路径
          output: './dist',
        },
        // windows系统相关配置
        win: {
          icon: 'public/icon.ico',
        },
        // mac系统相关配置
        mac: {
          icon: 'public/icon.icns',
        },
        // 制作成安装程序配置
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: 'public/icon.ico', // 安装图标
          uninstallerIcon: 'public/icon.ico', // 卸载图标
          installerHeaderIcon: 'public/icon.ico', // 安装时头部图标
          createDesktopShortcut: true, // 创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'TylooChat', // 图标名称
        },
      },
    },
  },
};
