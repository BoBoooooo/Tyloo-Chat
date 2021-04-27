<!--
 * @file: 左侧消息列表
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="room" ref="room">
    <div v-for="chat in chatArr" :key="chat.groupId || chat.userId">
      <div
        v-if="chat.groupId"
        class="room-card"
        :class="{ active: activeRoom && activeRoom.groupId === chat.groupId }"
        @click="changeActiveRoom(chat)"
        v-contextmenu="'groupmenu' + chat.groupId"
      >
        <!-- 自定义右键菜单 -->
        <v-contextmenu :ref="'groupmenu' + chat.groupId">
          <v-contextmenu-item v-if="chat.isTop === true" @click="handleCommand('TOP_REVERT', chat)">取消置顶</v-contextmenu-item>
          <v-contextmenu-item v-else @click="handleCommand('TOP', chat)">置顶</v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('READ', chat)">标记已读</v-contextmenu-item>
          <v-contextmenu-item divider></v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('DELETE', chat)">删除</v-contextmenu-item>
        </v-contextmenu>
        <a-badge class="room-card-badge" dot v-if="unReadGather[chat.groupId]" />
        <img class="room-card-type" src="~@/assets/group.png" alt="" />
        <div class="room-card-message">
          <div class="room-card-info">
            <div class="room-card-name">{{ chat.groupName }}</div>
            <!-- 显示最后一次聊天时间 -->
            <div
              class="room-card-time"
              v-if="chat.messages && chat.messages[chat.messages.length - 1]"
              v-text="_formatTime(chat.messages[chat.messages.length - 1])"
            ></div>
          </div>
          <div class="room-card-new" v-if="chat.messages">
            <!-- 消息列表未读信息简述考虑撤回情况 -->
            <template v-if="chat.messages[chat.messages.length - 1].isRevoke">
              <div>{{ chat.messages[chat.messages.length - 1].revokeUserName }}撤回了一条消息</div>
            </template>
            <template v-else>
              <div
                v-text="_parseText(chat.messages[chat.messages.length - 1])"
                v-if="chat.messages[chat.messages.length - 1].messageType === 'text'"
              ></div>
              <div class="image" v-if="chat.messages[chat.messages.length - 1].messageType === 'image'">[图片]</div>
            </template>
          </div>
        </div>
      </div>
      <div
        v-else
        class="room-card"
        :class="{ active: activeRoom && !activeRoom.groupId && activeRoom.userId === chat.userId }"
        @click="changeActiveRoom(chat)"
        v-contextmenu="'contextmenu' + chat.userId"
      >
        <!-- 自定义右键菜单 -->
        <v-contextmenu :ref="'contextmenu' + chat.userId">
          <v-contextmenu-item v-if="chat.isTop === true" @click="handleCommand('TOP_REVERT', chat)">取消置顶</v-contextmenu-item>
          <v-contextmenu-item v-else @click="handleCommand('TOP', chat)">置顶</v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('READ', chat)">标记已读</v-contextmenu-item>
          <v-contextmenu-item divider></v-contextmenu-item>
          <v-contextmenu-item @click="handleCommand('DELETE', chat)">删除</v-contextmenu-item>
        </v-contextmenu>
        <a-badge class="room-card-badge" :count="unReadGather[chat.userId]" />
        <img class="room-card-type" :src="apiUrl + friendGather[chat.userId].avatar" :class="{ offLine: avatarOffLine(chat) }" alt="" />
        <div class="room-card-message">
          <div class="room-card-info">
            <div class="room-card-name">{{ chat.username }}</div>
            <!-- 显示最后一次聊天时间 -->
            <div
              class="room-card-time"
              v-if="chat.messages && chat.messages[chat.messages.length - 1]"
              v-text="_formatTime(chat.messages[chat.messages.length - 1])"
            ></div>
          </div>
          <div class="room-card-new" v-if="chat.messages">
            <!-- 消息列表未读信息简述考虑撤回情况 -->
            <template v-if="chat.messages[chat.messages.length - 1].isRevoke">
              <div>{{ chat.messages[chat.messages.length - 1].revokeUserName }}撤回了一条消息</div>
            </template>
            <template v-else>
              <div
                v-text="_parseText(chat.messages[chat.messages.length - 1])"
                v-if="chat.messages[chat.messages.length - 1].messageType === 'text'"
              ></div>
              <div class="image" v-if="chat.messages[chat.messages.length - 1].messageType === 'image'">[图片]</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { parseText, formatTime } from '@/utils/common';
import { DEFAULT_ROBOT } from '@/common';

const chatModule = namespace('chat');
const appModule = namespace('app');
@Component
export default class Room extends Vue {
  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @chatModule.Getter('unReadGather') unReadGather: UnReadGather;

  @chatModule.Mutation('lose_unread_gather') lose_unread_gather: Function;

  @appModule.Getter('user') user: User;

  @appModule.Getter('apiUrl') apiUrl: string;

  chatArr: Array<Group | Friend> = [];

  created() {
    this.sortChat();
  }

  mounted() {
    // hack方法 页面初始化时定位到当前room
    setTimeout(() => {
      this.setRoomScrollTop();
    }, 100);
  }

  // 重置滚动条至当前activeRoom位置
  setRoomScrollTop() {
    const { offsetHeight: roomHeight, scrollTop: roomTop } = (document.querySelector('.room') as HTMLElement)!;
    const activeRommDom = document.querySelector('.room-card.active') as HTMLElement;
    if (activeRommDom) {
      const { offsetTop: domTop } = activeRommDom!;
      if (domTop - roomHeight >= roomTop) {
        document.querySelector('.room')!.scrollTop = domTop - roomHeight;
      }
    }
  }

  @Watch('groupGather', { deep: true })
  changeGroupGather() {
    this.sortChat();
  }

  @Watch('friendGather', { deep: true })
  changeFriendGather() {
    this.sortChat();
  }

  @Watch('activeRoom')
  changeActiveRoomEvent() {
    this.$nextTick(() => {
      this.setRoomScrollTop();
    });
  }

  get currentUserId() {
    return this.user.userId;
  }

  // 右键菜单
  async handleCommand(type: ContextMenuType, chat: Group & User) {
    // 消息ID
    const chatId = chat.groupId || chat.userId;
    if (type === 'TOP') {
      // 修复重复置顶bug,在已置顶某个窗口的情况下 直接置顶另外一个,需要先取消第一个置顶的窗口
      const topId = await this.$localforage.getItem(`${this.currentUserId}-topChatId`);
      if (topId) {
        const topRoom = this.chatArr.find((room) => ((room as any).groupId || room.userId) === topId);
        if (topRoom) {
          delete topRoom.isTop;
        }
      }
      await this.$localforage.setItem(`${this.currentUserId}-topChatId`, chatId);
      await this.sortChat();
      this.$message.success('置顶成功');
    } else if (type === 'TOP_REVERT') {
      await this.$localforage.removeItem(`${this.currentUserId}-topChatId`);
      // 删除isTop属性,取消置顶
      // eslint-disable-next-line no-param-reassign
      delete chat.isTop;
      await this.sortChat();
      this.$message.info('取消置顶');
    } else if (type === 'READ') {
      this.lose_unread_gather(chatId);
    } else if (type === 'DELETE') {
      // 如果删除的是默认群组,不允许删除
      if (chat.groupId === 'group') {
        this.$message.error('默认群组不允许删除');
        return;
      }
      // 如果聊天列表仅有一个消息不允许删除
      if (this.chatArr.length > 1) {
        // 先查询本地时候有删除记录
        const deletedChat = (await this.$localforage.getItem(`${this.currentUserId}-deletedChatId`)) as string[];
        if (Array.isArray(deletedChat)) {
          if (!deletedChat.includes(chatId)) {
            deletedChat.push(chatId);
          }
          await this.$localforage.setItem(`${this.currentUserId}-deletedChatId`, deletedChat);
        } else {
          // 本地删除聊天(非删除好友,本地记录)
          await this.$localforage.setItem(`${this.currentUserId}-deletedChatId`, [chatId]);
        }
        // 删除聊天窗口后默认激活第一个聊天窗口
        await this.sortChat();
        this.$message.success(`已删除${chat.groupName || chat.username}聊天窗口`);
        this.changeActiveRoom(this.chatArr[0] as User | Group);
      } else {
        this.$message.error('无法删除');
      }
    }
  }

  // 用户是否离线状态
  avatarOffLine(chat: Friend) {
    // 机器人默认在线
    return chat.userId === DEFAULT_ROBOT ? false : !chat.online;
  }

  // 获取消息列表数据
  async sortChat() {
    const groups = Object.values(this.groupGather);
    const friends = Object.values(this.friendGather);
    // 此处避免Await造成v-for页面闪烁问题,所以在最后才赋值this.chatArr = roomArr;
    let roomArr = [...groups, ...friends];
    // 此处需要过滤本地已删除的会话
    const deletedChat = (await this.$localforage.getItem(`${this.currentUserId}-deletedChatId`)) as string[];
    if (Array.isArray(deletedChat)) {
      roomArr = roomArr.filter((chat) => !deletedChat.includes((chat as Group).groupId || chat.userId));
    }

    // 对聊天窗进行排序(根据最新消息时间)
    roomArr = roomArr.sort((a: Group | Friend, b: Group | Friend) => {
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
    const topChatId = (await this.$localforage.getItem(`${this.currentUserId}-topChatId`)) as string;
    if (topChatId) {
      // 找到需要置顶的窗口
      const chat = roomArr.find((c) => ((c as Group).groupId || c.userId) === topChatId);
      if (chat) {
        // 移动至第一位
        roomArr = roomArr.filter((k) => ((k as Group).groupId || k.userId) !== topChatId);
        chat.isTop = true;
        roomArr.unshift(chat);
      }
    }

    this.chatArr = roomArr;
  }

  changeActiveRoom(activeRoom: User | Group) {
    this.$emit('setActiveRoom', activeRoom);
    // 激活聊天室时清空未读消息列表
    this.lose_unread_gather((activeRoom as Group).groupId || (activeRoom as User).userId);
  }

  _parseText(chat: User & FriendMessage & GroupMessage) {
    if (chat.groupId) {
      const unReadCount = this.unReadGather[chat.groupId];
      if (unReadCount && unReadCount > 1) {
        return `[${this.unReadGather[chat.groupId]}条] ${chat.username}:${parseText(chat.content)}`;
      }
      return `${chat.username}:${parseText(chat.content)}`;
    }
    return parseText(chat.content);
  }

  _formatTime(chat: User & FriendMessage & GroupMessage) {
    return formatTime(chat.time);
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
    &:hover,
    &.active {
      background-color: #d6d6d6;
    }
    .room-card-badge {
      position: absolute;
      left: 40px;
      top: 10px;
      ::v-deep.ant-badge-count {
        box-shadow: none;
        width: 10px;
      }
    }
    .room-card-type {
      width: 40px;
      height: 40px;
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
      .room-card-info {
        .room-card-name {
          overflow: hidden; //超出的文本隐藏
          text-overflow: ellipsis; //溢出用省略号显示
          white-space: nowrap; //溢出不换行
          color: #474747;
          font-weight: bold;
          font-size: 16px;
          display: inline-block;
          max-width: 110px;
        }
        .room-card-time {
          overflow: hidden; //超出的文本隐藏
          text-overflow: ellipsis; //溢出用省略号显示
          white-space: nowrap; //溢出不换行
          color: #a9a9a9;
          font-size: 14px;
          float: right;
        }
      }

      .room-card-new {
        > * {
          color: #a9a9a9;
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
