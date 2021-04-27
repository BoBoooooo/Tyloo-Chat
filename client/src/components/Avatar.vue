<!--
 * @file: 头像区域
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="avatar">
    <a-popover v-if="data.userId !== user.userId" trigger="click">
      <div slot="content" class="avatar-card">
        <a-card :bordered="false" style="width: 300px">
          <template slot="title">
            <h2>{{ (userGather[data.userId] && userGather[data.userId].username) || data.username }}</h2>
            <a-avatar
              :size="60"
              style="float: right"
              :src="apiUrl + ((userGather[data.userId] && userGather[data.userId].avatar) || data.avatar)"
            />
          </template>
          <a-button
            v-if="user.role === 'admin'"
            style="margin-bottom: 5px"
            @click="deleteUser(data.userId)"
            :loading="loading"
            type="primary"
          >
            删除用户
          </a-button>
          <a-button @click="_setActiveRoom(data.userId)" type="primary" v-if="friendGather[data.userId]">发消息</a-button>
          <a-button @click="addFriend(data.userId)" :loading="loading" type="primary" v-else>添加好友</a-button>
        </a-card>
      </div>
      <a-avatar
        :style="{ order: data.userId === user.userId && highLight ? '3' : '1' }"
        class="avatar-img"
        :class="{ offLine: !data.online && highLight === false }"
        :src="apiUrl + ((userGather[data.userId] && userGather[data.userId].avatar) || data.avatar)"
      />
    </a-popover>
    <a-avatar
      v-else
      class="avatar-img"
      :style="{ order: data.userId === user.userId && highLight ? '3' : '1' }"
      :class="{ offLine: !data.online && highLight === false }"
      :src="apiUrl + ((userGather[data.userId] && userGather[data.userId].avatar) || data.avatar)"
    />
    <div class="avatar-name" style="order: 2">{{ (userGather[data.userId] && userGather[data.userId].username) || data.username }}</div>
    <div class="avatar-time" :style="{ order: data.userId === user.userId && highLight ? '1' : '3' }" v-if="showTime">
      {{ _formatTime(data.time) }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import * as api from '@/api/apis';
import { namespace } from 'vuex-class';
import { formatTime } from '@/utils/common';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component
export default class Avatar extends Vue {
  @Prop() data: User; // 用户信息

  @Prop({ default: true }) showTime: boolean; // 是否显示时间

  @Prop({ type: Boolean, default: false }) highLight: boolean; // 头像是否常亮

  @appModule.Getter('user') user: User;

  @appModule.Getter('apiUrl') apiUrl: string;

  @appModule.Getter('loading') loading: boolean;

  @chatModule.Getter('userGather') userGather: FriendGather;

  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @chatModule.Getter('socket') socket: SocketIOClient.Socket;

  @chatModule.Mutation('set_active_room') setActiveRoom: Function;

  @appModule.Mutation('set_loading') setLoading: Function;

  addFriend(friendId: string) {
    // 设置按钮loading,避免网络延迟重复点击造成多次执行
    this.setLoading(true);
    this.socket.emit('addFriend', {
      userId: this.user.userId,
      friendId,
      createTime: new Date().valueOf(),
    });
  }

  _formatTime(time: number) {
    return formatTime(time);
  }

  async deleteUser(userId: string) {
    this.setLoading(true);
    await api.deleteUser({
      uid: this.user.userId,
      psw: this.user.password,
      did: userId,
    });
    this.setLoading(false);
  }

  _setActiveRoom(userId: string) {
    this.setActiveRoom(this.friendGather[userId]);
  }
}
</script>
<style lang="scss" scoped>
.avatar {
  display: flex;
  align-items: center;
  height: 37px;
  margin-bottom: 6px;
  .avatar-img {
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 0;
  }
  .offLine {
    filter: grayscale(100%);
  }
  .avatar-name {
    margin: 0 12px;
    color: #080808;
    margin: 0 12px;
    max-width: 160px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    color: #080808;
  }
  .avatar-time {
    font-size: 12px;
    color: #080808;
  }
}
.avatar-card {
  display: flex;
  font-size: 18px;
  flex-direction: column;
  align-items: center;
  .ant-card-body {
    text-align: right;
  }
  h2 {
    display: inline-block;
    line-height: 60px;
    max-width: 190px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  > div {
    margin: 4px;
  }
}
</style>
