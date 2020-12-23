import { MutationTree } from 'vuex';
import {
  SET_USER, CLEAR_USER, SET_TOKEN, SET_ACTIVETABNAME,
} from './mutation-types';
import { AppState } from './state';

const mutations: MutationTree<AppState> = {
  [SET_USER](state, payload: User) {
    state.user = payload;
    // 数据持久化
    localStorage.setItem('user', JSON.stringify(payload));
  },

  [CLEAR_USER](state) {
    state.user = {
      userId: '',
      username: '',
      password: '',
      avatar: '',
      createTime: 0,
    };
    localStorage.setItem('user', '');
  },

  [SET_TOKEN](state, payload) {
    state.token = payload;
    localStorage.setItem('token', payload);
  },

  [SET_ACTIVETABNAME](state, payload: 'message' | 'contacts') {
    state.activeTabName = payload;
  },
};

export default mutations;
