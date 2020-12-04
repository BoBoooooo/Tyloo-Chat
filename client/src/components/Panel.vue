<!--
 * @file: 聊天窗口右上角 删除好友、群聊管理
 * @copyright: NanJing Anshare Tech .Com
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="active">
    <div v-if="type === 'group'">
      <a-icon
        type="more"
        @click="toggleGroupUser"
        class="active-button"
        style="transform: rotate(90deg)"
        :class="{ heightLight: showGroupUser }"
      />
      <a-drawer
        placement="right"
        :closable="false"
        :visible="showGroupUser"
        :get-container="getElement"
        @close="toggleGroupUser"
        :wrap-style="{ position: 'absolute', top: '60px' }"
      >
        <div class="active-content" v-if="activeGroupUser[activeRoom.groupId]">
          <div class="active-content-title">
            <div class="active-content-title-label">群名</div>
            <div>
              <span class="active-content-title-detail">{{ activeRoom.groupName }}</span>
              <a-icon v-if="currentUserIsManager" @click="showGroupNameDialog = true" type="edit" />
            </div>
            <div class="active-content-title-label">群公告</div>
            <div>
              <span class="active-content-title-detail">{{ activeRoom.notice }}</span>
              <a-icon @click="showGroupNoticeDialog = true" :type="currentUserIsManager ? 'edit' : 'eye'" />
            </div>
          </div>
          <div class="active-content-sum">群人数: ({{ activeNum }}/{{ groupUserList.length }})</div>
          <div class="active-content-users">
            <div class="active-content-user" v-for="(data, index) in groupUserList" :key="data.userId + index">
              <Avatar :data="data" :showTime="false"></Avatar>
              {{ data.username }}
              <!-- 群主标识 -->
              <a-icon class="icon" type="user" v-if="isManager(data)" />
            </div>
          </div>
          <a-button type="danger" class="active-content-out" @click="exitGroup">退出群聊</a-button>
        </div>
      </a-drawer>
    </div>
    <!-- 删除好友,机器人默认不允许删除 -->
    <div v-else-if="!isRobot">
      <a-popconfirm title="确定要删除该好友吗？" placement="bottomRight" ok-text="Yes" cancel-text="No" @confirm="exitFriend">
        <a-icon type="more" style="transform: rotate(90deg)" class="active-button" />
      </a-popconfirm>
    </div>
    <!-- 修改群公告 -->
    <a-modal v-if="activeRoom.notice" title="群公告" :visible="showGroupNoticeDialog">
      <a-textarea v-if="currentUserIsManager" v-model="groupNotice"></a-textarea>
      <p v-else>
        {{ activeRoom.notice }}
      </p>
      <template #footer>
        <a-button v-if="currentUserIsManager" type="primary" @click="handleUpdateGroupInfo">
          修改
        </a-button>
        <a-button @click="() => (showGroupNoticeDialog = false)">关闭</a-button>
      </template>
    </a-modal>
    <!-- 修改群名称 -->
    <a-modal v-if="activeRoom.groupName" title="群名称" :visible="showGroupNameDialog">
      <a-input v-if="currentUserIsManager" v-model="groupName"></a-input>
      <p v-else>
        {{ activeRoom.groupName }}
      </p>
      <template #footer>
        <a-button type="primary" @click="handleUpdateGroupInfo">
          修改
        </a-button>
        <a-button @click="() => (showGroupNameDialog = false)">关闭</a-button>
      </template>
    </a-modal>
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

  @Prop({ default: () => [], type: Array }) groupUserList: Array<User>;

  @appModule.Getter('user') user: User;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.State('socket') socket: SocketIOClient.Socket;

  @chatModule.Getter('activeGroupUser') activeGroupUser: ActiveGroupUser;

  showGroupUser: boolean = false;

  showGroupNoticeDialog: boolean = false;

  showGroupNameDialog: boolean = false;

  groupNotice: string = ''; // 群公告

  groupName: string = ''; // 群名称

  get activeNum() {
    // 修复在线人数bug,当前聊天窗口为私聊窗口时 "(error during evaluation)"
    if (this.type === 'group') {
      return Object.keys(this.activeGroupUser[this.activeRoom.groupId]).length;
    }
    return 0;
  }

  get isRobot() {
    return this.activeRoom.userId === '智能助手';
  }

  // 获取当前在线所有用户id
  get activeGroupUserIdList() {
    if (this.type === 'group') {
      return Object.keys(this.activeGroupUser[this.activeRoom.groupId]);
    }
    return [];
  }

  // 当前用户是否为群主
  get currentUserIsManager() {
    return this.isManager(this.user);
  }

  // 群成员是否为群主
  isManager(user: User) {
    return user.userId === this.activeRoom.userId && this.type === 'group';
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
    // 退群后关闭Panel
    setTimeout(() => {
      this.showGroupUser = false;
    }, 300);
  }

  exitFriend() {
    this.socket.emit('exitFriend', {
      userId: this.user.userId,
      friendId: this.activeRoom.userId,
    });
  }

  // 设置在线状态
  filterGroupUsers(userIds: string[]) {
    // eslint-disable-next-line no-restricted-syntax
    for (const user of this.groupUserList) {
      const isOnlineUser = userIds.some(userId => userId === user.userId);
      // 在线用户 online true,离线 false
      // eslint-disable-next-line no-unused-expressions
      isOnlineUser ? (user.online = true) : (user.online = false);
    }
  }

  // 更新群信息
  handleUpdateGroupInfo() {
    if (!this.groupNotice) {
      this.$message.warning('请输入群公告');
      return;
    }
    this.socket.emit('updateGroupInfo', {
      groupId: this.activeRoom.groupId,
      groupName: this.groupName,
      notice: this.groupNotice,
    });
    this.showGroupNameDialog = false;
    this.showGroupNoticeDialog = false;
  }

  // 监听在线状态,发生变更则重新设置在线状态
  @Watch('activeGroupUserIdList')
  activeGroupUserIdListChange(userIds: string[]) {
    console.log(userIds);
    this.filterGroupUsers(userIds);
  }

  @Watch('groupUserList')
  groupUserListChange() {
    // 群成员发生改变,切换房间
    this.groupNotice = this.activeRoom.notice;
    this.groupName = this.activeRoom.groupName;
    this.filterGroupUsers(this.activeGroupUserIdList);
  }

  @Watch('type')
  changeType() {
    if (this.type === 'friend') {
      this.showGroupUser = false;
    }
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
    color: #2b2b2b;
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
