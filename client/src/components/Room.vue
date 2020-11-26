<!--
 * @file: 左侧消息列表
 * @copyright: NanJing Anshare Tech .Com
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="room">
    <div v-for="(chat, index) in chatArr" :key="(chat.userId || chat.groupId) + index">
      <div
        v-if="chat.groupId"
        class="room-card"
        :class="{ active: activeRoom && activeRoom.groupId === chat.groupId }"
        @click="changeActiveRoom(chat)"
        v-contextmenu="'groupmenu'+chat.userId"
      >
         <!-- 自定义右键菜单 -->
        <v-contextmenu :ref="'groupmenu'+chat.userId">
          <v-contextmenu-item v-if="chat.isTop === true" @click="handleCommand('TOP-REVERT', chat)">取消置顶</v-contextmenu-item>
          <v-contextmenu-item v-else @click="handleCommand('TOP', chat)">置顶</v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('READ', chat)">标记已读</v-contextmenu-item>
          <v-contextmenu-item divider></v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('DELETE', chat)">删除</v-contextmenu-item>
        </v-contextmenu>
        <a-badge class="room-card-badge" :count="unReadGather[chat.groupId]" />
        <img class="room-card-type" src="~@/assets/group.png" alt="" />
        <div class="room-card-message">
          <div class="room-card-name">{{ chat.groupName }}</div>
          <div class="room-card-new" v-if="chat.messages">
            <div
              class="text"
              v-text="_parseText(chat.messages[chat.messages.length - 1].content)"
              v-if="chat.messages[chat.messages.length - 1].messageType === 'text'"
            ></div>
            <div class="image" v-if="chat.messages[chat.messages.length - 1].messageType === 'image'">[图片]</div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="room-card"
        :class="{ active: activeRoom && !activeRoom.groupId && activeRoom.userId === chat.userId }"
        @click="changeActiveRoom(chat)"
        v-contextmenu="'contextmenu'+chat.userId"
      >
        <!-- 自定义右键菜单 -->
        <v-contextmenu :ref="'contextmenu'+chat.userId">
          <v-contextmenu-item v-if="chat.isTop === true" @click="handleCommand('TOP-REVERT', chat)">取消置顶</v-contextmenu-item>
          <v-contextmenu-item v-else @click="handleCommand('TOP', chat)">置顶</v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('READ', chat)">标记已读</v-contextmenu-item>
          <v-contextmenu-item divider></v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('DELETE', chat)">删除</v-contextmenu-item>
        </v-contextmenu>
        <a-badge class="room-card-badge" :count="unReadGather[chat.userId]" />
        <img class="room-card-type" :src="friendGather[chat.userId].avatar" :class="{ offLine: avatarOffLine(chat) }" alt="" />
        <div class="room-card-message">
          <div class="room-card-name">{{ chat.username }}</div>
          <div class="room-card-new" v-if="chat.messages">
            <div
              class="text"
              v-text="_parseText(chat.messages[chat.messages.length - 1].content)"
              v-if="chat.messages[chat.messages.length - 1].messageType === 'text'"
            ></div>
            <div class="image" v-if="chat.messages[chat.messages.length - 1].messageType === 'image'">[图片]</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { parseText } from '@/utils/common';
import { DEFAULT_GROUP, DEFAULT_ROBOT } from '@/common';

const chatModule = namespace('chat');
const appModule = namespace('app');
@Component
export default class Room extends Vue {
  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @chatModule.Getter('unReadGather') unReadGather: UnReadGather;

  @chatModule.Getter('activeGroupUser') activeGroupUser: ActiveGroupUser;

  @chatModule.Mutation('lose_unread_gather') lose_unread_gather: Function;

  @appModule.Getter('user') user: User;

  chatArr: Array<Group | Friend> = [];

  created() {
    this.sortChat();
  }

  @Watch('groupGather', { deep: true })
  changeGroupGather() {
    this.sortChat();
  }

  @Watch('friendGather', { deep: true })
  changeFriendGather() {
    this.sortChat();
  }

  get activeUserGather() {
    return this.activeGroupUser[DEFAULT_GROUP];
  }

  get currentUserId() {
    return this.user.userId;
  }

  // 右键菜单
  handleCommand(type: string, chat: Group & User) {
    if (type === 'TOP') {
      localStorage.setItem(`${this.currentUserId}-topChatId`, chat.userId);
      this.sortChat();
      this.$message.success('置顶成功');
    } else if (type === 'TOP-REVERT') {
      localStorage.removeItem(`${this.currentUserId}-topChatId`);
      // 删除isTop属性,取消置顶
      // eslint-disable-next-line no-param-reassign
      delete chat.isTop;
      this.sortChat();
      this.$message.info('取消置顶');
    } else if (type === 'READ') {
      this.lose_unread_gather((chat as Group).groupId || (chat as User).userId);
    } else if (type === 'DELETE') {
      if (this.chatArr.length > 1) {
        // 先查询本地时候有删除记录
        let deletedChat = localStorage.getItem(`${this.currentUserId}-deletedChatId`);
        if (deletedChat) {
          if (!deletedChat.split(',').includes(chat.userId)) {
            deletedChat += `,${chat.userId}`;
          }
          localStorage.setItem(`${this.currentUserId}-deletedChatId`, deletedChat);
        } else {
        // 本地删除聊天(非删除好友,本地记录)
          localStorage.setItem(`${this.currentUserId}-deletedChatId`, `${chat.userId}`);
        }
        // 删除聊天窗口后默认激活第一个聊天窗口
        this.sortChat();
        this.$message.success(`已删除${chat.groupName || chat.username}聊天窗口`);
        this.changeActiveRoom(this.chatArr[0] as (User | Group));
      } else {
        this.$message.error('无法删除');
      }
    }
  }

  // 是否在线
  avatarOffLine(chat: any) {
    // 机器人默认在线
    return chat.userId !== DEFAULT_ROBOT ? !this.activeUserGather[chat.userId] : false;
  }

  // 获取消息列表数据
  sortChat() {
    this.chatArr = [];
    const groups = Object.values(this.groupGather);
    const friends = Object.values(this.friendGather);
    this.chatArr = [...groups, ...friends];
    // 此处需要过滤本地已删除的会话

    const deletedChat = localStorage.getItem(`${this.currentUserId}-deletedChatId`);
    if (deletedChat) {
      this.chatArr = this.chatArr.filter(chat => !deletedChat.split(',').some(d => d === chat.userId));
    }

    // 对聊天窗进行排序(根据最新消息时间)
    this.chatArr = this.chatArr.sort((a: Group | Friend, b: Group | Friend) => {
      if (a.messages && b.messages) {
        // @ts-ignore
        return b.messages[b.messages.length - 1].time - a.messages[a.messages.length - 1].time;
      }
      if (a.messages) {
        return -1;
      }
      return 1;
    });

    // 查看是否有需要置顶列表
    const topChatId = localStorage.getItem(`${this.currentUserId}-topChatId`);
    if (topChatId) {
      // 找到需要置顶的窗口
      const chat = this.chatArr.find(c => c.userId === topChatId);
      if (chat) {
        // 移动至第一位
        this.chatArr = this.chatArr.filter(k => k.userId !== topChatId);
        chat.isTop = true;
        this.chatArr.unshift(chat);
      }
    }
  }

  changeActiveRoom(activeRoom: User | Group) {
    this.$emit('setActiveRoom', activeRoom);
    // 激活聊天室时清空未读消息列表
    this.lose_unread_gather((activeRoom as Group).groupId || (activeRoom as User).userId);
  }

  _parseText(text: string) {
    return parseText(text);
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

@mixin button($bcolor, $url, $x1, $y1, $bor, $col) {
  background: $bcolor;
  -webkit-mask: url($url);
  mask: url($url);
  -webkit-mask-size: $x1 $y1;
  mask-size: $x1 $y1;
  border: $bor;
  color: $col;
}

.room {
  height: calc(100% - 60px);
  overflow: auto;
  background: $room-bg-color;
  .room-card {
    position: relative;
    min-height: 65px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e8e8e8 !important;
    // background-color: rgba(0, 0, 0, 0.2);
    padding: 5px 10px;
    text-align: left;
    transition: all 0.2s linear;
    cursor: pointer;
    &:hover {
      background-color: #d6d6d6;
    }
    &.active {
      background-color: #d6d6d6;
      @include button(#d6d6d6, '~@/assets/animate.png', 3000%, 100%, none, #fff);
      -webkit-animation: ani 2s steps(29) forwards;
      animation: ani 0.5s steps(29) forwards;
    }
    .room-card-badge {
      position: absolute;
      right: 10px;
      top: 10px;
      ::v-deep.ant-badge-count {
        box-shadow: none;
      }
    }
    .room-card-type {
      width: 45px;
      height: 45px;
      margin-right: 10px;
      // border-radius: 50%;
      object-fit: cover;
      &.offLine {
        filter: grayscale(100%);
      }
    }
    .room-card-message {
      flex: 1;
      display: flex;
      width: 75%;
      flex-direction: column;
      .room-card-name {
        overflow: hidden; //超出的文本隐藏
        text-overflow: ellipsis; //溢出用省略号显示
        white-space: nowrap; //溢出不换行
        color: #474747;
        font-weight: bold;
      }
      .text {
        color: #a9a9a9;
      }
      .room-card-new {
        > * {
          display: block;
          overflow: hidden; //超出的文本隐藏
          text-overflow: ellipsis; //溢出用省略号显示
          white-space: nowrap; //溢出不换行
        }
        color: rgb(255, 255, 255, 0.6);
        font-size: 14px;
      }
    }
  }
}

@keyframes ani {
  from {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }

  to {
    -webkit-mask-position: 0 0;
    mask-position: 0 0;
  }
}
</style>
