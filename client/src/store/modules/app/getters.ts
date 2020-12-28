import { GetterTree } from 'vuex';
import cookie from 'js-cookie';
import { AppState } from './state';
import { RootState } from '../../index';

const getters: GetterTree<AppState, RootState> = {
  user(state) {
    // eslint-disable-next-line no-unused-expressions
    state.user;
    const user = cookie.get('user');
    if (!user) {
      return {};
    }
    state.user = JSON.parse(user);
    return state.user;
  },
  mobile(state) {
    return state.mobile;
  },
  background(state) {
    // eslint-disable-next-line no-unused-expressions
    state.background;
    return localStorage.getItem('background');
  },
  activeTabName(state) {
    return state.activeTabName;
  },
  token(state) {
    return state.token;
  },
  apiUrl(state) {
    return state.apiUrl;
  },
  loading(state) {
    return state.loading;
  },
};

export default getters;
