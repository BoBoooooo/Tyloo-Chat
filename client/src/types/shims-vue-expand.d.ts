/* eslint-disable */
import VueRouter, { Route } from 'vue-router';

import { Store } from 'vuex';

// 扩充
declare module 'vue/types/vue' {
  interface Vue {
    $router: VueRouter;
    $localforage: any
    $route: Route;
    $store: Store<any>;
  }
}