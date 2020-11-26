<!--
 * @file: 聊天窗口右上角 删除好友、群聊管理
 * @copyright: NanJing Anshare Tech .Com
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="active">
    <div v-if="type === 'group'">
      <a-icon type="more" @click="toggleGroupUser" class="active-button" style="transform: rotate(90deg)" :class="{ heightLight: showGroupUser }" />
      <a-drawer
        placement="right"
        :closable="false"
        :visible="showGroupUser"
        :get-container="getElement"
        @close="toggleGroupUser"
        :wrap-style="{ position: 'absolute',top: '60px' }"
      >
        <div class="active-content" v-if="activeGroupUser[activeRoom.groupId]">
          <div class="active-content-title">
            <div class="active-content-title-label">群名</div>
            <div>{{activeRoom.groupName}}</div>
            <div class="active-content-title-label">群公告</div>
            <div>{{activeRoom.notice}}</div>
          </div>
          <div class="active-content-sum">在线人数: {{ activeNum }}</div>
          <div class="active-content-users">
            <div class="active-content-user" v-for="data in activeGroupUser[activeRoom.groupId]" :key="data.userId">
              <avatar :data="data" :showTime="false"></avatar>
              {{ data.username }}
            </div>
          </div>
          <a-button type="danger" class="active-content-out" @click="exitGroup">退出群聊</a-button>
        </div>
      </a-drawer>
    </div>
    <div v-else-if="!isRobot">
      <a-popconfirm title="确定要删除该好友吗？" placement="bottomRight" ok-text="Yes" cancel-text="No" @confirm="exitFriend">
        <a-icon type="more" style="transform: rotate(90deg)" class="active-button" />
      </a-popconfirm>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Component, Vue, Prop, Watch,
} from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Avatar from './Avatar.vue';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    Avatar,
  },
})
export default class Panel extends Vue {
  @Prop({ default: 'group' }) type: string;

  @appModule.Getter('user') user: User;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.State('socket') socket: SocketIOClient.Socket;

  @chatModule.Getter('activeGroupUser') activeGroupUser: ActiveGroupUser;

  showGroupUser: boolean = false;

  @Watch('type')
  changeType() {
    if (this.type === 'friend') {
      this.showGroupUser = false;
    }
  }

  get activeNum() {
    return Object.keys(this.activeGroupUser[this.activeRoom.groupId]).length;
  }

  get isRobot() {
    return this.activeRoom.userId === '智能助手';
  }

  toggleGroupUser() {
    this.showGroupUser = !this.showGroupUser;
  }

  getElement() {
    return document.getElementsByClassName('message')[0];
  }

  exitGroup() {
    this.socket.emit('exitGroup', {
      userId: this.user.userId,
      groupId: this.activeRoom.groupId,
    });
  }

  exitFriend() {
    this.socket.emit('exitFriend', {
      userId: this.user.userId,
      friendId: this.activeRoom.userId,
    });
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

.active {
  position: absolute;
  width: 170px;
  right: 0;
  z-index: 100;
  border-radius: 0 0 5px 5px;
  .active-button {
    position: absolute;
    z-index: 999;
    top: 18px;
    right: 20px;
    font-size: 25px;
    color:#2b2b2b;
    cursor: pointer;
    &:active {
      color: $primary-color;
    }
  }
  .active-button.heightLight {
    color: $primary-color;
  }
}
::-webkit-scrollbar {
  display: none !important;
}
</style>
