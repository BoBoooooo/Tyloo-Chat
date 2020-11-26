import { ActionTree } from 'vuex';
import io from 'socket.io-client';
import Vue from 'vue';
import { DEFAULT_GROUP } from '@/common/index';
import { ChatState } from './state';
import { RootState } from '../../index';
import {
  SET_SOCKET,
  SET_DROPPED,
  SET_ACTIVE_GROUP_USER,
  ADD_GROUP_MESSAGE,
  ADD_FRIEND_MESSAGE,
  SET_FRIEND_MESSAGES,
  SET_GROUP_GATHER,
  SET_FRIEND_GATHER,
  SET_USER_GATHER,
  SET_ACTIVE_ROOM,
  DEL_GROUP,
  DEL_FRIEND,
  ADD_UNREAD_GATHER,
} from './mutation-types';

const actions: ActionTree<ChatState, RootState> = {
  // 初始化socket连接和监听socket事件
  async connectSocket({
    commit, state, dispatch, rootState,
  }, callback) {
    const { user } = rootState.app;
    const socket: SocketIOClient.Socket = io.connect(`/?userId=${user.userId}`, { reconnection: true });
    console.log(user);
    socket.on('connect', async () => {
      console.log('连接成功');

      // 获取聊天室所需所有信息
      socket.emit('chatData', user);

      // 先保存好socket对象
      commit(SET_SOCKET, socket);
    });

    // 初始化事件监听
    socket.on('activeGroupUser', (data: any) => {
      console.log('activeGroupUser', data);
      commit(SET_ACTIVE_GROUP_USER, data.data);
    });

    // 新建群组
    socket.on('addGroup', (res: ServerRes) => {
      console.log('on addGroup', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      Vue.prototype.$message.success(res.msg);
      commit(SET_GROUP_GATHER, res.data);
    });

    // 加入群组
    socket.on('joinGroup', async (res: ServerRes) => {
      console.log('on joinGroup', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      const newUser = res.data.user;
      const { group } = res.data;
      if (newUser.userId !== user.userId) {
        commit(SET_USER_GATHER, newUser);
        return Vue.prototype.$message.info(`${newUser.username}加入群${group.groupName}`);
      }
      console.log(state.groupGather, group.groupId);
      // 是用户自己 则加入到某个群
      if (!state.groupGather[group.groupId]) {
        commit(SET_GROUP_GATHER, group);
        // 获取群里面所有用户的用户信息
        socket.emit('chatData', user);
      }
      Vue.prototype.$message.info(`成功加入群${group.groupName}`);
      commit(SET_ACTIVE_ROOM, state.groupGather[group.groupId]);
    });
    //
    socket.on('joinGroupSocket', (res: ServerRes) => {
      console.log('on joinGroupSocket', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      const newUser: Friend = res.data.user;
      const { group } = res.data;
      const { friendGather } = state;
      if (newUser.userId !== user.userId) {
        commit(SET_USER_GATHER, newUser);
        if (friendGather[newUser.userId]) {
          // 当用户的好友更新了用户信息
          let messages;
          if (friendGather[newUser.userId].messages) {
            // eslint-disable-next-line prefer-destructuring
            messages = friendGather[newUser.userId].messages;
          }
          commit(SET_FRIEND_GATHER, newUser);
          commit(SET_FRIEND_MESSAGES, messages);
        }
        // @ts-ignore 解决重复进群消息问题
        if (window.msg === newUser.userId) {
          return;
        }
        // @ts-ignore
        window.msg = newUser.userId;
        return Vue.prototype.$message.info(`${newUser.username}加入群${group.groupName}`);
      }
      if (!state.groupGather[group.groupId]) {
        commit(SET_GROUP_GATHER, group);
      }
      commit(SET_USER_GATHER, newUser);
    });

    socket.on('groupMessage', (res: ServerRes) => {
      console.log('on groupMessage', res);
      if (!res.code) {
        commit(ADD_GROUP_MESSAGE, res.data);
        const { activeRoom } = state;
        if (activeRoom && activeRoom.groupId !== res.data.groupId) {
          commit(ADD_UNREAD_GATHER, res.data.groupId);
        }
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('addFriend', (res: ServerRes) => {
      console.log('on addFriend', res);
      if (!res.code) {
        commit(SET_FRIEND_GATHER, res.data);
        commit(SET_USER_GATHER, res.data);
        Vue.prototype.$message.info(res.msg);
        socket.emit('joinFriendSocket', {
          userId: user.userId,
          friendId: res.data.userId,
        });
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('joinFriendSocket', (res: ServerRes) => {
      console.log('on joinFriendSocket', res);
      // 添加好友之后默认进入好友聊天房间
      commit(SET_ACTIVE_ROOM, state.friendGather[res.data.friendId]);
      if (!res.code) {
        console.log('成功加入私聊房间');
      }
    });

    socket.on('friendMessage', (res: ServerRes) => {
      console.log('on friendMessage', res);
      if (!res.code) {
        if (res.data.friendId === user.userId || res.data.userId === user.userId) {
          console.log('ADD_FRIEND_MESSAGE', res.data);
          commit(ADD_FRIEND_MESSAGE, res.data);
          const { activeRoom } = state;
          if (activeRoom && activeRoom.userId !== res.data.userId && activeRoom.userId !== res.data.friendId) {
            commit(ADD_UNREAD_GATHER, res.data.userId);
          }
        }
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('chatData', (res: ServerRes) => {
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      dispatch('handleChatData', res.data);
      commit(SET_DROPPED, false);
    });

    // 退出群组
    socket.on('exitGroup', (res: ServerRes) => {
      if (!res.code) {
        commit(DEL_GROUP, res.data);
        commit(SET_ACTIVE_ROOM, state.groupGather[DEFAULT_GROUP]);
        Vue.prototype.$message.success(res.msg);
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    // 删除好友
    socket.on('exitFriend', (res: ServerRes) => {
      if (!res.code) {
        commit(DEL_FRIEND, res.data);
        commit(SET_ACTIVE_ROOM, state.groupGather[DEFAULT_GROUP]);
        Vue.prototype.$message.success(res.msg);
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });
  },

  async handleChatData({
    commit, dispatch, state, rootState,
  }, payload) {
    const { user } = rootState.app;
    const { socket } = state;
    const { groupGather } = state;
    const groupArr = payload.groupData;
    const friendArr = payload.friendData;
    const userArr = payload.userData;
    if (groupArr.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const group of groupArr) {
        socket.emit('joinGroupSocket', {
          groupId: group.groupId,
          userId: user.userId,
        });
        commit(SET_GROUP_GATHER, group);
      }
    }
    if (friendArr.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const friend of friendArr) {
        socket.emit('joinFriendSocket', {
          userId: user.userId,
          friendId: friend.userId,
        });
        commit(SET_FRIEND_GATHER, friend);
      }
    }
    if (userArr.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const user_ of userArr) {
        commit(SET_USER_GATHER, user_);
      }
    }

    /**
     * 由于groupgather和userGather都更新了, 但是activeGather依旧是老对象,
     * 这里需要根据老的activeGather找到最新的gather对象,这样才能使得vue的watch监听新gather
     */

    const { activeRoom } = state;
    const groupGather2 = state.groupGather;
    const friendGather2 = state.friendGather;
    if (!activeRoom) {
      // 更新完数据没有默认activeRoom设置群为DEFAULT_GROUP
      return commit(SET_ACTIVE_ROOM, groupGather[DEFAULT_GROUP]);
    }
    commit(SET_ACTIVE_ROOM, groupGather2[activeRoom.groupId] || friendGather2[activeRoom.userId]);
  },
};

export default actions;
