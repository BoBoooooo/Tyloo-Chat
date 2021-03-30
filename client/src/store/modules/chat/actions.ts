import { ActionTree } from 'vuex';
import io from 'socket.io-client';
import Vue from 'vue';
import { DEFAULT_GROUP } from '@/common/index';
import localforage from 'localforage';
import { SET_LOADING, CLEAR_USER } from '../app/mutation-types';
import { ChatState } from './state';
import { RootState } from '../../index';
import {
  SET_SOCKET,
  SET_DROPPED,
  ADD_GROUP_MESSAGE,
  ADD_FRIEND_MESSAGE,
  SET_GROUP_GATHER,
  SET_FRIEND_GATHER,
  SET_USER_GATHER,
  SET_ACTIVE_ROOM,
  DEL_GROUP,
  DEL_GROUP_MEMBER,
  DEL_FRIEND,
  ADD_UNREAD_GATHER,
  REVOKE_MESSAGE,
  USER_ONLINE,
  USER_OFFLINE,
  ADD_GROUP_MEMBER,
  UPDATE_USER_INFO,
} from './mutation-types';

const actions: ActionTree<ChatState, RootState> = {
  // 初始化socket连接和监听socket事件
  async connectSocket({ commit, state, dispatch, rootState }) {
    const { user, token } = rootState.app;
    const socket: SocketIOClient.Socket = io.connect(`ws://${process.env.VUE_APP_API_URL.split('http://')[1]}`, {
      reconnection: true,
      query: {
        token,
        userId: user.userId,
      },
    });
    // token校验,失败则要求重新登录
    socket.on('unauthorized', (msg: string) => {
      Vue.prototype.$message.error(msg);
      // 清空token,socket
      commit(`app/${CLEAR_USER}`, {}, { root: true });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    socket.on('connect', async () => {
      console.log('连接成功');
      // 获取聊天室所需所有信息
      socket.emit('chatData', token);

      // 先保存好socket对象
      commit(SET_SOCKET, socket);
    });
    // 用户上线
    socket.on('userOnline', (data: any) => {
      console.log('userOnline', data);
      commit(USER_ONLINE, data.data);
    });

    // 用户下线
    socket.on('userOffline', (data: any) => {
      console.log('userOffline', data);
      commit(USER_OFFLINE, data.data);
    });

    // 新建群组
    socket.on('addGroup', (res: ServerRes) => {
      console.log('on addGroup', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      Vue.prototype.$message.success(res.msg);
      commit(SET_GROUP_GATHER, res.data);
      commit(`app/${SET_LOADING}`, false, { root: true });
    });

    // 加入群组
    socket.on('joinGroup', async (res: ServerRes) => {
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      console.log('on joinGroup', res);
      const { invited, group, userId } = res.data;

      // 此处区分是搜索群加入群聊还是被邀请加入群聊
      if (invited) {
        // 被邀请的用户Id
        const { friendIds } = res.data;
        // 当前用户被邀请加入群,则加入群
        if (friendIds.includes(user.userId) && !state.groupGather[group.groupId]) {
          // commit(SET_GROUP_GATHER, group);
          // 获取群里面所有用户的用户信息
          socket.emit('chatData', token);
        } else if (userId === user.userId) {
          // 邀请发起者
          commit(ADD_GROUP_MEMBER, {
            groupId: group.groupId,
            members: Object.values(state.friendGather).filter((friend) => friendIds.includes(friend.userId)),
          });
          const groupGather2 = state.groupGather;
          // ?? 待优化
          commit(SET_ACTIVE_ROOM, groupGather2[group.groupId]);
          return Vue.prototype.$message.info(res.msg);
        }
      } else {
        const newUser = res.data.user as Friend;
        newUser.online = 1;
        // 新用户加入群
        if (newUser.userId !== rootState.app.user.userId) {
          commit(ADD_GROUP_MEMBER, {
            groupId: group.groupId,
            members: [newUser],
          });
          return Vue.prototype.$message.info(`${newUser.username}加入群${group.groupName}`);
        }
        // 是用户自己 则加入到某个群
        if (!state.groupGather[group.groupId]) {
          commit(SET_GROUP_GATHER, group);
          // 获取群里面所有用户的用户信息
          socket.emit('chatData', token);
        }
        Vue.prototype.$message.info(`成功加入群${group.groupName}`);
        commit(SET_ACTIVE_ROOM, state.groupGather[group.groupId]);
        commit(`app/${SET_LOADING}`, false, { root: true });
      }
    });
    //
    socket.on('joinGroupSocket', (res: ServerRes) => {
      console.log('on joinGroupSocket', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      const newUser: Friend = res.data.user;
      newUser.online = 1;
      const { group } = res.data;
      const groupObj = state.groupGather[group.groupId];
      // 新用户注册后默认进入到DEFAULT_GROUP,此处需要判断一下是否在群内,不在群内的话需要加入本群中
      // 否则在线的用户无法收到新成员进群的变更
      if (!groupObj.members!.find((member) => member.userId === newUser.userId)) {
        newUser.isManager = 0;
        groupObj.members!.push(newUser);
        Vue.prototype.$message.info(res.msg);
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
        // 取消loading
        Vue.prototype.$message.info(res.msg);
        socket.emit('joinFriendSocket', {
          userId: user.userId,
          friendId: res.data.userId,
        });
      } else {
        Vue.prototype.$message.error(res.msg);
      }
      commit(`app/${SET_LOADING}`, false, { root: true });
    });

    socket.on('joinFriendSocket', (res: ServerRes) => {
      console.log('on joinFriendSocket', res);
      // 添加好友之后默认进入好友聊天房间,初始化时不默认选中该好友房间
      if (!state.activeRoom) {
        commit(SET_ACTIVE_ROOM, state.friendGather[res.data.friendId]);
      }
      if (!res.code) {
        console.log('成功加入私聊房间');
      }
    });

    socket.on('friendMessage', async (res: ServerRes) => {
      console.log('on friendMessage', res);
      if (!res.code) {
        if (res.data.friendId === user.userId || res.data.userId === user.userId) {
          console.log('ADD_FRIEND_MESSAGE', res.data);
          commit(ADD_FRIEND_MESSAGE, res.data);
          // 新增私聊信息需要检测本地是否已删除聊天,如已删除需要恢复
          let deletedChat = (await localforage.getItem(`${user.userId}-deletedChatId`)) as string[];
          if (deletedChat) {
            if (res.data.friendId === user.userId) {
              deletedChat = deletedChat.filter((id) => id !== res.data.userId);
            } else {
              deletedChat = deletedChat.filter((id) => id !== res.data.friendId);
            }
            await localforage.setItem(`${user.userId}-deletedChatId`, deletedChat);
          }
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
      console.log(res);
      dispatch('handleChatData', res.data);
      commit(SET_DROPPED, false);
    });

    // 退出群组
    socket.on('exitGroup', (res: ServerRes) => {
      if (!res.code) {
        // 如果是当前用户退群,则删除群聊
        if (res.data.userId === user.userId) {
          commit(DEL_GROUP, res.data);
          commit(SET_ACTIVE_ROOM, state.groupGather[DEFAULT_GROUP]);
          Vue.prototype.$message.success(res.msg);
        } else {
          console.log(`--用户--${res.data.userId}`, '--退出群--', res.data.groupId);
          // 广播给其他用户,从群成员中删除该成员
          commit(DEL_GROUP_MEMBER, res.data);
        }
      } else if (res.data.userId === user.userId) {
        Vue.prototype.$message.error(res.msg);
      }
    });

    // 更新群信息
    socket.on('updateGroupInfo', (res: ServerRes) => {
      if (!res.code) {
        const group = state.groupGather[res.data.groupId];
        if (group) {
          group.groupName = res.data.groupName;
          group.notice = res.data.notice;
          if (state.activeRoom!.groupId) {
            state.activeRoom!.groupName = res.data.groupName;
            state.activeRoom!.notice = res.data.notice;
          }
          if (res.data.userId === user.userId) {
            Vue.prototype.$message.success(res.msg);
          }
        }
      }
    });

    // 更新好友信息
    socket.on('updateUserInfo', (res: ServerRes) => {
      if (!res.code) {
        commit(UPDATE_USER_INFO, res.data);
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

    // 消息撤回
    socket.on('revokeMessage', (res: ServerRes) => {
      if (!res.code) {
        commit(REVOKE_MESSAGE, res.data);
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });
  },

  // 根据chatData返回的好友列表群组列表
  // 建立各自socket连接
  // 并保存至各自Gather
  async handleChatData({ commit, dispatch, state, rootState }, payload) {
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
    console.log('init');
    console.log(activeRoom);
    const groupGather2 = state.groupGather;
    const friendGather2 = state.friendGather;
    if (!activeRoom) {
      console.log(DEFAULT_GROUP);
      // 更新完数据没有默认activeRoom设置群为DEFAULT_GROUP
      return commit(SET_ACTIVE_ROOM, groupGather[DEFAULT_GROUP]);
    }
    commit(SET_ACTIVE_ROOM, groupGather2[activeRoom.groupId] || friendGather2[activeRoom.userId]);
  },
};

export default actions;
