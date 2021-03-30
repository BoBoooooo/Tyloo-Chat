import Vue from 'vue';
import { MutationTree } from 'vuex';
import {
  SET_SOCKET,
  SET_DROPPED,
  ADD_GROUP_MEMBER,
  ADD_GROUP_MESSAGE,
  SET_GROUP_MESSAGES,
  ADD_FRIEND_MESSAGE,
  SET_FRIEND_MESSAGES,
  SET_ACTIVE_ROOM,
  SET_GROUP_GATHER,
  SET_FRIEND_GATHER,
  SET_USER_GATHER,
  DEL_GROUP,
  DEL_GROUP_MEMBER,
  DEL_FRIEND,
  ADD_UNREAD_GATHER,
  LOSE_UNREAD_GATHER,
  REVOKE_MESSAGE,
  USER_ONLINE,
  USER_OFFLINE,
  UPDATE_USER_INFO,
} from './mutation-types';
import { ChatState } from './state';

const mutations: MutationTree<ChatState> = {
  // 保存socket
  [SET_SOCKET](state, payload: SocketIOClient.Socket) {
    state.socket = payload;
  },

  // 设置用户是否处于掉线重连状态
  [SET_DROPPED](state, payload: boolean) {
    state.dropped = payload;
  },

  /**
   * 用户上线
   * @param state
   * @param payload userId
   */
  [USER_ONLINE](state, userId: string) {
    // 更新好友列表用户状态
    if (state.friendGather[userId]) {
      console.log(`${userId}----上线`);
      Vue.set(state.friendGather[userId], 'online', 1);
      console.log(state.friendGather);
    }
    // 更新所有群组中该成员在线状态
    (Object.values(state.groupGather) as Group[]).forEach((group) => {
      const member = group.members!.find((m) => m.userId === userId);
      if (member) {
        member.online = 1;
      }
    });
  },

  // 用户下线
  [USER_OFFLINE](state, userId: string) {
    if (state.friendGather[userId]) {
      Vue.set(state.friendGather[userId], 'online', 0);
    }
    // 更新所有群组中该成员在线状态
    (Object.values(state.groupGather) as Group[]).forEach((group) => {
      const member = group.members!.find((m) => m.userId === userId);
      if (member) {
        member.online = 0;
      }
    });
  },
  // 新增群成员
  [ADD_GROUP_MEMBER](
    state,
    payload: {
      groupId: string;
      members: Friend[];
    }
  ) {
    const members: Friend[] = payload.members.map((member) => ({
      ...member,
      isManager: 0,
    }));
    if (state.groupGather[payload.groupId].members && members) {
      state.groupGather[payload.groupId].members = state.groupGather[payload.groupId].members!.concat(members);
    } else {
      // vuex对象数组中对象改变不更新问题
      Vue.set(state.groupGather[payload.groupId], 'members', members);
    }
  },
  // 新增一条群消息
  [ADD_GROUP_MESSAGE](state, payload: GroupMessage) {
    if (state.groupGather[payload.groupId].messages) {
      state.groupGather[payload.groupId].messages!.push(payload);
    } else {
      // vuex对象数组中对象改变不更新问题
      Vue.set(state.groupGather[payload.groupId], 'messages', [payload]);
    }
  },

  // 设置群消息
  [SET_GROUP_MESSAGES](state, payload: GroupMessage[]) {
    if (payload && payload.length) {
      Vue.set(state.groupGather[payload[0].groupId], 'messages', payload);
    }
  },

  // 新增一条私聊消息
  [ADD_FRIEND_MESSAGE](state, payload: FriendMessage) {
    // @ts-ignore
    const { userId } = this.getters['app/user'];
    if (payload.friendId === userId) {
      if (state.friendGather[payload.userId].messages) {
        state.friendGather[payload.userId].messages!.push(payload);
      } else {
        Vue.set(state.friendGather[payload.userId], 'messages', [payload]);
      }
    } else if (state.friendGather[payload.friendId].messages) {
      state.friendGather[payload.friendId].messages!.push(payload);
    } else {
      Vue.set(state.friendGather[payload.friendId], 'messages', [payload]);
    }
  },

  // 设置私聊记录
  [SET_FRIEND_MESSAGES](state, payload: FriendMessage[]) {
    // @ts-ignore
    const { userId } = this.getters['app/user'];
    if (payload && payload.length) {
      if (payload[0].friendId === userId) {
        Vue.set(state.friendGather[payload[0].userId], 'messages', payload);
      } else {
        Vue.set(state.friendGather[payload[0].friendId], 'messages', payload);
      }
    }
  },

  // 设置当前聊天对象(群或好友)
  [SET_ACTIVE_ROOM](state, payload: Friend & Group) {
    state.activeRoom = payload;
  },

  // 设置所有的群的群详细信息(头像,群名字等)
  [SET_GROUP_GATHER](state, payload: Group) {
    Vue.set(state.groupGather, payload.groupId, payload);
  },

  // 设置所有的用户的用户详细信息(头像,昵称等)
  [SET_USER_GATHER](state, payload: User) {
    Vue.set(state.userGather, payload.userId, payload);
  },

  // 设置所有的好友的用户详细信息(头像,昵称等)
  [SET_FRIEND_GATHER](state, payload: User) {
    Vue.set(state.friendGather, payload.userId, payload);
  },

  // 设置所有的用户的用户详细信息(头像,昵称等)
  [UPDATE_USER_INFO](state, user: User) {
    const { userId, username, avatar } = user;
    const { userGather, friendGather } = state;
    if (userGather[userId]) {
      userGather[userId].username = username;
      userGather[userId].avatar = avatar;
    }
    if (friendGather[userId]) {
      friendGather[userId].username = username;
      friendGather[userId].avatar = avatar;
    }
  },

  // 退群
  [DEL_GROUP](state, payload: GroupMap) {
    Vue.delete(state.groupGather, payload.groupId);
  },

  // 删除群成员
  [DEL_GROUP_MEMBER](state, payload: GroupMap) {
    const group = state.groupGather[payload.groupId];
    if (group) {
      group.members = group.members!.filter((member) => member.userId !== payload.userId);
    }
  },

  // 删好友
  [DEL_FRIEND](state, payload: UserMap) {
    Vue.delete(state.friendGather, payload.friendId);
  },

  // 给某个聊天组添加未读消息
  [ADD_UNREAD_GATHER](state, payload: string) {
    document.title = '【有未读消息】TylooChat聊天室';
    if (!state.unReadGather[payload]) {
      Vue.set(state.unReadGather, payload, 1);
    } else {
      ++state.unReadGather[payload];
    }
  },

  // 给某个聊天组清空未读消息
  [LOSE_UNREAD_GATHER](state, payload: string) {
    document.title = 'TylooChat聊天室';
    Vue.set(state.unReadGather, payload, 0);
  },

  // 消息撤回
  [REVOKE_MESSAGE](state, payload: FriendMessage & GroupMessage & { username: string }) {
    // @ts-ignore
    const { userId } = this.getters['app/user'];
    // 撤回的为群消息
    if (payload.groupId) {
      const { messages } = state.groupGather[payload.groupId];
      // 将该消息设置为isRevoke,并设置撤回人姓名
      if (messages) {
        const msg = messages.find((message) => message._id === payload._id);
        if (msg) {
          Vue.set(msg, 'isRevoke', true);
          Vue.set(msg, 'revokeUserName', payload.username);
        }
      }
    } else {
      const { messages } = state.friendGather[payload.friendId === userId ? payload.userId : payload.friendId];
      // 将该消息设置为isRevoke,并设置撤回人姓名
      if (messages) {
        const msg = messages.find((message) => message._id === payload._id);
        if (msg) {
          Vue.set(msg, 'isRevoke', true);
          Vue.set(msg, 'revokeUserName', payload.username);
        }
      }
    }
  },
};

export default mutations;
