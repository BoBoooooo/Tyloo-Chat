import { GetterTree } from 'vuex';
import cookie from 'js-cookie';
import { AppState } from './state';
import { RootState } from '../../index';

const getters: GetterTree<AppState, RootState> = {
  user(state) {
    // eslint-disable-next-line no-unused-expressions
    state.user;
    const userString = cookie.get('user');
    if (!userString) {
      return {};
    }
    const user = JSON.parse(userString);
    user.avatar = `${state.apiUrl}/${user.avatar}`;
    state.user = user;
    return state.user;
  },
  apiUrl(state) {
    return state.apiUrl;
  },
  activeTabName(state) {
    return state.activeTabName;
  },
};

export default getters;
