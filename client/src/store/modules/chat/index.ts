import { Module } from 'vuex';
import actions from './actions';
import mutations from './mutations';
import getters from './getters';
import state, { ChatState } from './state';
import { RootState } from '../../index';

const chat: Module<ChatState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};

export default chat;
