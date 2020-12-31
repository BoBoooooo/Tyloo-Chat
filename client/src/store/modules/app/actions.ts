import { ActionTree } from 'vuex';
import axios from '@/api/axios';
import { processReturn } from '@/utils/common';
import { SET_USER, SET_TOKEN, SET_LOADING } from './mutation-types';
import { AppState } from './state';
import { RootState } from '../../index';

const actions: ActionTree<AppState, RootState> = {
  async register({ commit }, payload) {
    commit(SET_LOADING, true);
    const res = await axios.post('/auth/register', {
      ...payload,
    });
    const data = processReturn(res);
    commit(SET_LOADING, false);
    if (data) {
      commit(SET_USER, data.user);
      commit(SET_TOKEN, data.token);
      return data;
    }
  },
  async login({ commit }, payload) {
    commit(SET_LOADING, true);
    const res = await axios.post('/auth/login', {
      ...payload,
    });
    const data = processReturn(res);
    commit(SET_LOADING, false);
    if (data) {
      commit(SET_USER, data.user);
      commit(SET_TOKEN, data.token);
      return data;
    }
  },
};

export default actions;
