<!--
 * @file: 聊天窗口右上角 删除好友、群聊管理
 * @copyright: BoBo
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
        :wrap-style="{ position: 'absolute', top: '0' }"
      >
        <div class="active-content">
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
          <div class="active-content-sum">群人数: ({{ activeNum }}/{{ groupUsers.length }})</div>
          <div class="active-content-adduser" @click="showContactDialog">
            <a-icon class="icon" type="plus-square" />
            <span class="label">添加成员</span>
          </div>
          <div class="active-content-users">
            <div class="active-content-user" v-for="(data, index) in groupUsers" :key="data.userId + index">
              <!-- 群成员头像,智能助手默认在线 highLight强制头像高亮-->
              <Avatar :highLight="data.userId === 'robot'" :data="data" :showTime="false"></Avatar>
              {{ data.username }}
              <!-- 群主标识 -->
              <a-icon class="icon" type="user" v-if="data.isManager === 1" />
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
    <a-modal v-if="activeRoom.notice" title="群公告" :visible="showGroupNoticeDialog" @cancel="() => (showGroupNoticeDialog = false)">
      <a-textarea v-if="currentUserIsManager" v-model="groupNotice"></a-textarea>
      <p v-else>
        {{ activeRoom.notice }}
      </p>
      <template #footer>
        <a-button v-if="currentUserIsManager" type="primary" @click="handleUpdateGroupInfo"> 修改 </a-button>
        <a-button @click="() => (showGroupNoticeDialog = false)">关闭</a-button>
      </template>
    </a-modal>
    <!-- 修改群名称 -->
    <a-modal v-if="activeRoom.groupName" title="群名称" :visible="showGroupNameDialog" @cancel="() => (showGroupNameDialog = false)">
      <a-input v-if="currentUserIsManager" v-model="groupName"></a-input>
      <p v-else>
        {{ activeRoom.groupName }}
      </p>
      <template #footer>
        <a-button type="primary" @click="handleUpdateGroupInfo"> 修改 </a-button>
        <a-button @click="() => (showGroupNameDialog = false)">关闭</a-button>
      </template>
    </a-modal>
    <!-- 添加用户进群 -->
    <ContactModal v-if="activeRoom.members" ref="contactDialog"></ContactModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Avatar from './Avatar.vue';
import ContactModal from './ContactModal.vue';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    Avatar,
    ContactModal,
  },
})
export default class Panel extends Vue {
  $refs!: {
    contactDialog: HTMLFormElement;
  };

  @Prop({ default: 'group' }) type: string;

  @appModule.Getter('user') user: User;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.State('socket') socket: SocketIOClient.Socket;

  showGroupUser: boolean = false;

  // 修改/查看群公告dialog
  showGroupNoticeDialog: boolean = false;

  // 修改群名Dialog
  showGroupNameDialog: boolean = false;

  groupNotice: string = ''; // 群公告

  groupName: string = ''; // 群名称

  get activeNum() {
    // 修复在线人数bug,当前聊天窗口为私聊窗口时 "(error during evaluation)"
    if (this.type === 'group' && this.activeRoom.members) {
      return this.activeRoom.members!.filter((item) => item.online).length;
    }
    return 0;
  }

  get isRobot() {
    return this.activeRoom.userId === '智能助手';
  }

  // 当前用户是否为群主
  get currentUserIsManager() {
    return this.isManager(this.user);
  }

  // 群成员排序,在线的排在前
  get groupUsers() {
    return this.$lodash.orderBy(this.activeRoom.members, ['isManager', 'online', 'username'], ['desc', 'desc', 'asc']);
  }

  showContactDialog() {
    this.$refs.contactDialog.showDialog();
  }

  // 群成员是否为群主
  isManager(user: User) {
    return user.userId === this.activeRoom.userId && this.type === 'group';
  }

  toggleGroupUser() {
    this.showGroupUser = !this.showGroupUser;
  }

  getElement() {
    return document.getElementsByClassName('message-container')[0];
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

  @Watch('activeRoom.groupId', {
    immediate: true,
  })
  activeRoomGroupChange() {
    this.groupName = this.activeRoom.groupName;
    this.groupNotice = this.activeRoom.notice;
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
