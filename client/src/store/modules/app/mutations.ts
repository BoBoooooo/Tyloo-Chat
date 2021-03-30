import cookie from 'js-cookie';
import { MutationTree } from 'vuex';
import { SET_USER, CLEAR_USER, SET_TOKEN, SET_MOBILE, SET_BACKGROUND, SET_ACTIVETABNAME, SET_LOADING } from './mutation-types';
import { AppState } from './state';

const mutations: MutationTree<AppState> = {
  [SET_USER](state, payload: User) {
    state.user = payload;
    // 数据持久化
    cookie.set('user', payload, { expires: 3650 });
  },

  [CLEAR_USER](state) {
    state.user = {
      userId: '',
      username: '',
      password: '',
      avatar: '',
      createTime: 0,
    };
    cookie.set('user', '');
    cookie.set('token', '');
  },

  [SET_TOKEN](state, payload) {
    state.token = payload;
    cookie.set('token', payload, { expires: 3 });
  },

  [SET_MOBILE](state, payload: boolean) {
    state.mobile = payload;
  },

  [SET_BACKGROUND](state, payload: string) {
    state.background = payload;
    localStorage.setItem('background', payload);
  },
  [SET_ACTIVETABNAME](state, payload: 'message' | 'contacts') {
    state.activeTabName = payload;
  },
  [SET_LOADING](state, payload: boolean) {
    state.loading = payload;
  },
};

export default mutations;
