/*
 * @file: Main js 入口文件
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
 */

import Vue from 'vue';
import Viewer from 'v-viewer'; // 图片预览插件
import moment from 'moment'; // 引入moment
import contentmenu from 'v-contextmenu';
import lodash from 'lodash';
import localforage from 'localforage';
import App from './App.vue';
import router from './router';
import store from './store';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'viewerjs/dist/viewer.css';
import './plugins/ant-desigin'; // 引入ant-desigin
import 'v-contextmenu/dist/index.css';

Vue.use(contentmenu);
Vue.config.productionTip = false;
// 使用中文时间
Vue.prototype.$moment = moment;
// lodash
Vue.prototype.$lodash = lodash;

// localforage https://localforage.docschina.org/
// 基于IndexedDB二次封装
Vue.prototype.$localforage = localforage;
Vue.use(Viewer, {
  defaultOptions: {
    navbar: false,
    title: false,
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 4,
      reset: 4,
      prev: 0,
      next: 0,
      rotateLeft: 4,
      rotateRight: 4,
      flipHorizontal: 4,
      flipVertical: 4,
    },
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
