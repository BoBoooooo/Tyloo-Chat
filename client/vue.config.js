const Host = 'http://localhost:3000';
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';

// cdn链接
const cdn = {
  css: [
    // antd css 由于引入失败只好放弃了antd的按需引入
  ],
  js: [
    // vue
    'https://cdn.bootcdn.net/ajax/libs/vue/2.6.10/vue.min.js',
    // vue-router
    'https://cdn.bootcdn.net/ajax/libs/vue-router/3.1.3/vue-router.min.js',
    // vuex
    'https://cdn.bootcdn.net/ajax/libs/vuex/3.1.2/vuex.min.js',
    // axios
    'https://cdn.bootcdn.net/ajax/libs/axios/0.18.0/axios.min.js',
    // moment
    'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min.js',
    // lodash
    'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.20/lodash.min.js',
  ],
};

const CompressionWebpackPlugin = require('compression-webpack-plugin');

module.exports = {
  chainWebpack: (config) => {
    // 需要打包分析时取消注释
    // eslint-disable-next-line global-require
    // config.plugin('webpack-bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);

    // 配置cdn引入
    if (process.env.NODE_ENV === 'production' && process.env.VUE_APP_CDN === 'true') {
      const externals = {
        vue: 'Vue',
        axios: 'axios',
        'vue-router': 'VueRouter',
        vuex: 'Vuex',
        moment: 'moment',
        lodash: '_',
      };
      config.externals(externals);
      // 通过 html-webpack-plugin 将 cdn 注入到 index.html 之中
      config.plugin('html').tap((args) => {
        // eslint-disable-next-line no-param-reassign
        args[0].cdn = cdn;
        return args;
      });
    }
  },
  configureWebpack: (config) => {
    // 代码 gzip
    const productionGzipExtensions = ['html', 'js', 'css'];
    // 开发模式下不走gzip
    if (!isDev) {
      config.plugins.push(
        new CompressionWebpackPlugin({
          filename: '[path].gz[query]',
          algorithm: 'gzip',
          test: new RegExp(`\\.(${productionGzipExtensions.join('|')})$`),
          threshold: 10240, // 只有大小大于该值的资源会被处理 10240
          minRatio: 0.8, // 只有压缩率小于这个值的资源才会被处理
          deleteOriginalAssets: false, // 删除原文件
        }),
      );
    }

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
  // webSocket本身不存在跨域问题，所以我们可以利用webSocket来进行非同源之间的通信。
  publicPath: './',
  devServer: {
    port: 1997,
    proxy: {
      '/api': {
        target: Host,
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
      'socket.io': {
        target: Host,
        ws: true,
        changeOrigin: true,
      },
    },
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
      // builderOptions这一层是electron-builder的配置
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
          icon: 'deployment/icons/icon.ico',
        },
        // mac系统相关配置
        mac: {
          icon: 'deployment/icons/icon.icns',
        },
        // 制作成安装程序配置
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: 'deployment/icons/icon.ico', // 安装图标
          uninstallerIcon: 'deployment/icons/icon.ico', // 卸载图标
          installerHeaderIcon: 'deployment/icons/icon.ico', // 安装时头部图标
          createDesktopShortcut: true, // 创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'TylooChat', // 图标名称
        },
      },
    },
  },
};
