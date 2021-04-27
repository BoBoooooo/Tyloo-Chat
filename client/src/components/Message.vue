<!--
 * @file: 消息窗口
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="message-container">
    <div class="message-header">
      <div class="message-header-box">
        <span class="message-header-text"
          >{{ chatName }}
          <template v-if="groupGather[activeRoom.groupId]"> ({{ activeRoom.members.length }}) </template>
        </span>
        <a-icon type="sync" spin class="message-header-icon" v-if="dropped" />
        <Panel v-if="groupGather[activeRoom.groupId]" type="group"></Panel>
        <Panel v-else type="friend"></Panel>
      </div>
    </div>
    <transition name="loading">
      <div class="message-loading" v-if="spinning && !isNoData">
        <a-icon type="sync" spin class="message-loading-icon" />
      </div>
    </transition>
    <!-- 群公告 -->
    <template v-if="groupGather[activeRoom.groupId] && messageOpacity">
      <a-alert ref="notification" class="message-notification" banner closable :description="activeRoom.notice" show-icon>
        <a-icon slot="icon" type="notification" />
      </a-alert>
    </template>
    <div class="message-main" :style="{ opacity: messageOpacity }">
      <div class="message-content">
        <transition name="noData">
          <div class="message-content-noData" v-if="isNoData">没有更多消息了~</div>
        </transition>
        <template v-for="item in activeRoom.messages">
          <!-- 消息被撤回 -->
          <div class="message-content-revoke" v-if="item.isRevoke" :key="item.userId + item.time">
            <span v-if="item.userId === user.userId"> 你撤回了一条消息 </span>
            <span v-else> {{ item.revokeUserName }}撤回了一条消息 </span>
          </div>
          <!-- 正常消息 -->
          <div v-else class="message-content-message" :key="item.userId + item.time" :class="{ 'text-right': item.userId === user.userId }">
            <Avatar highLight :data="item"></Avatar>
            <!-- 消息区域 -->
            <div v-contextmenu="'message' + item.userId + item.time">
              <a class="message-content-text" v-if="_isUrl(item.content)" :href="item.content" target="_blank">{{ item.content }}</a>
              <div class="message-content-text" v-text="_parseText(item.content)" v-else-if="item.messageType === 'text'"></div>
              <div class="message-content-image" v-if="item.messageType === 'image'" :style="getImageStyle(item.content)">
                <viewer style="display: flex; align-items: center">
                  <img :src="apiUrl + '/static/image/' + item.content" alt="" />
                </viewer>
              </div>
              <!-- 视频格式文件 -->
              <div class="message-content-image" v-if="item.messageType === 'video'">
                <video :src="apiUrl + '/static/file/' + item.content" controls="controls">您的浏览器不支持 video 标签。</video>
              </div>
              <!-- 附件类型消息 -->
              <div class="message-content-file" v-else-if="item.messageType === 'file'" @click="download(item)">
                <img class="message-content-icon" :src="getFileIcon(item)" alt="" />
                <div class="message-content-detail">
                  <div class="file-name">
                    {{ getFileName(item).name }}
                  </div>
                  <div class="file-size">
                    {{ getFileName(item).size }}
                  </div>
                </div>
              </div>
              <!-- 自定义右键菜单 -->
              <v-contextmenu :ref="'message' + item.userId + item.time">
                <v-contextmenu-item v-if="item.messageType === 'text'" @click="handleCommand('COPY', item)">复制</v-contextmenu-item>
                <v-contextmenu-item v-if="isShowRevoke(item)" @click="handleCommand('REVOKE', item)">撤回</v-contextmenu-item>
              </v-contextmenu>
            </div>
          </div>
        </template>
      </div>
    </div>
    <Entry></Entry>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import * as api from '@/api/apis';
import { namespace } from 'vuex-class';
import { isUrl, parseText, processReturn } from '@/utils/common';
import Avatar from './Avatar.vue';
import Panel from './Panel.vue';
import Entry from './Entry.vue';
import { FILE_SAVE_PATH, MIME_TYPE, IMAGE_TYPE } from '../common';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    Panel,
    Avatar,
    Entry,
  },
})
export default class Message extends Vue {
  @appModule.Getter('user') user: User;

  @appModule.Getter('mobile') mobile: boolean;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.Getter('socket') socket: SocketIOClient.Socket;

  @chatModule.Getter('dropped') dropped: boolean;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Getter('userGather') userGather: FriendGather;

  @chatModule.Mutation('set_dropped') set_dropped: Function;

  @chatModule.Mutation('set_group_messages') set_group_messages: Function;

  @chatModule.Mutation('set_friend_messages') set_friend_messages: Function;

  @chatModule.Mutation('set_user_gather') set_user_gather: Function;

  @appModule.Getter('apiUrl') apiUrl: string;

  text: string = '';

  needScrollToBottom: boolean = true;

  messageDom: HTMLElement;

  messageContentDom: HTMLElement;

  headerDom: HTMLElement;

  messageOpacity: number = 1;

  lastMessagePosition: number = 0;

  spinning: boolean = false;

  pageSize: number = 10;

  isNoData: boolean = false;

  lastTime: number = 0;

  mounted() {
    this.messageDom = document.getElementsByClassName('message-main')[0] as HTMLElement;
    this.messageContentDom = document.getElementsByClassName('message-content')[0] as HTMLElement;
    this.headerDom = document.getElementsByClassName('message-header-text')[0] as HTMLElement;
    this.messageDom.addEventListener('scroll', this.handleScroll);
    this.scrollToBottom();
  }

  // 右键菜单
  handleCommand(type: ContextMenuType, message: FriendMessage & GroupMessage) {
    if (type === 'COPY') {
      // 复制功能
      const copy = (e: any) => {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', message.content);
        } else if ((window as any).clipboardData) {
          (window as any).clipboardData.setData('Text', message.content);
        }
      };
      window.addEventListener('copy', copy);
      document.execCommand('Copy');
      window.removeEventListener('copy', copy);
      this.$message.info('已粘贴至剪切板');
      // eslint-disable-next-line no-undef
    } else if (type === 'REVOKE') {
      // 消息撤回功能
      this.socket.emit('revokeMessage', {
        userId: this.user.userId, // 当前用户Id
        username: this.user.username, // 当前用户名称
        groupId: this.activeRoom.groupId, // 当前群组Id
        friendId: this.activeRoom.userId, // 当前好友Id
        _id: message._id, // 撤回的消息Id
      });
    }
  }

  // 判断是否超过2分钟,超时不让撤回
  isShowRevoke(message: FriendMessage & GroupMessage) {
    return message.userId === this.user.userId && new Date().getTime() - message.time <= 1000 * 60 * 2;
  }

  /**
   * 附件下载函数
   */
  download(message: FriendMessage & GroupMessage) {
    const a = document.createElement('a');
    a.id = '__downloadFile__';
    a.href = `${this.apiUrl}${FILE_SAVE_PATH}${message.content}`;
    a.setAttribute('target', '__blank');
    document.body.append(a);
    a.click();
    document.getElementById('__downloadFile__')!.remove();
  }

  getFileName(item: FriendMessage & GroupMessage) {
    // 此处后台保存时默认写死  格式为  [date]$[userId]$[size]$[fileName]
    // 例如 fileName = 1606980397047$1a01e20f-3780-4227-84b5-5c69ca766ee5$15.41KB$123.docx
    const fileNameArr = item.content.split('$');
    const [, , size, name] = fileNameArr;
    return {
      name,
      size,
    };
  }

  getFileIcon(item: FriendMessage & GroupMessage) {
    const fileNameArr = item.content.split('$');
    const [, , , name] = fileNameArr;
    console.log(name);
    if (name) {
      const nameArr = name.split('.');
      const fileExtension = nameArr[nameArr.length - 1];
      console.log(fileExtension);
      // 获取附件图标(项目中预设了几种,如果找不到匹配的附件图标则默认用other.png)
      // eslint-disable-next-line no-nested-ternary
      const pngName = MIME_TYPE.includes(fileExtension)
        ? fileExtension
        : false || IMAGE_TYPE.includes(fileExtension)
        ? 'img'
        : false || 'other';
      return `${process.env.BASE_URL}mime/${pngName}.png`;
    }
  }

  get chatName() {
    if (this.groupGather[this.activeRoom.groupId]) {
      return this.groupGather[this.activeRoom.groupId].groupName;
    }
    if (this.userGather[this.activeRoom.userId]) {
      return this.userGather[this.activeRoom.userId].username;
    }
    return '';
  }

  /**
   * 点击切换房间进入此方法
   */
  @Watch('activeRoom')
  changeActiveRoom() {
    this.messageOpacity = 0;
    this.isNoData = false;
    // 聊天名过渡动画
    if (this.headerDom) {
      this.headerDom.classList.add('transition');
      setTimeout(() => {
        this.headerDom.classList.remove('transition');
      }, 400);
    }
    // 大数据渲染优化
    if (this.activeRoom.messages && this.activeRoom.messages.length > 30) {
      this.activeRoom.messages = this.activeRoom.messages.splice(this.activeRoom.messages.length - 30, 30) as GroupMessage[] &
        FriendMessage[];
    }
    this.scrollToBottom();
  }

  /**
   * 新消息会进入此方法
   */
  @Watch('activeRoom.messages', { deep: true })
  changeMessages() {
    // 新消息
    if (this.needScrollToBottom) {
      this.addMessage();
    }
    this.needScrollToBottom = true;
    this.$forceUpdate();
  }

  // 监听socket断连给出重连状态提醒
  @Watch('socket.disconnected') connectingSocket() {
    if (this.socket.disconnected) {
      this.set_dropped(true);
    }
  }

  /**
   * 在分页信息的基础上来了新消息
   */
  addMessage() {
    if (this.activeRoom.messages) {
      // 新消息来了只有是自己发的消息和消息框本身在底部才会滚动到底部
      const { messages } = this.activeRoom;
      if (
        (messages.length > 0 && messages[messages.length - 1].userId === this.user.userId) ||
        (this.messageDom && this.messageDom.scrollTop + this.messageDom.offsetHeight + 100 > this.messageContentDom.scrollHeight)
      ) {
        this.scrollToBottom();
      }
    }
  }

  /**
   * 监听滚动事件
   */
  handleScroll(event: Event) {
    if (event.currentTarget) {
      // 只有有消息且滚动到顶部时才进入
      if (this.messageDom.scrollTop === 0) {
        this.lastMessagePosition = this.messageContentDom.offsetHeight;
        const { messages } = this.activeRoom;
        if (messages && messages.length >= this.pageSize && !this.spinning) {
          this.getMoreMessage();
        }
      }
    }
  }

  /**
   * 消息获取节流
   */
  throttle(fn: Function, file?: File) {
    const nowTime = +new Date();
    if (nowTime - this.lastTime < 1000) {
      return this.$message.error('消息获取太频繁！');
    }
    fn(file);
    this.lastTime = nowTime;
  }

  /**
   * 获取更多消息
   * @params text
   */
  async getMoreMessage() {
    if (this.isNoData) {
      return false;
    }
    this.spinning = true;
    if (this.activeRoom.groupId) {
      await this.getGroupMessages();
    } else {
      await this.getFriendMessages();
    }
    this.$nextTick(() => {
      this.messageDom.scrollTop = this.messageContentDom.offsetHeight - this.lastMessagePosition;
      this.spinning = false;
      this.messageOpacity = 1;
    });
  }

  /**
   * 获取群聊消息
   */
  async getGroupMessages() {
    const { groupId } = this.activeRoom;
    const current = this.activeRoom.messages!.length;
    const currentMessage = this.activeRoom.messages ? this.activeRoom.messages : [];
    const data: PagingResponse = processReturn(
      await api.getGroupMessages({
        groupId,
        userId: this.user.userId,
        current,
        pageSize: this.pageSize,
      })
    );
    if (data) {
      if (!data.messageArr.length || data.messageArr.length < this.pageSize) {
        this.isNoData = true;
      }
      this.needScrollToBottom = false;
      this.set_group_messages([...data.messageArr, ...currentMessage]);
      // eslint-disable-next-line no-restricted-syntax
      for (const user of data.userArr) {
        if (!this.userGather[user.userId]) {
          this.set_user_gather(user);
        }
      }
    }
  }

  /**
   * 获取私聊消息
   */
  async getFriendMessages() {
    const { userId } = this.user;
    const friendId = this.activeRoom.userId;
    const current = this.activeRoom.messages!.length;
    const currentMessage = this.activeRoom.messages ? this.activeRoom.messages : [];
    const data: PagingResponse = processReturn(
      await api.getFriendMessage({
        userId,
        friendId,
        current,
        pageSize: this.pageSize,
      })
    );
    if (data) {
      if (!data.messageArr.length || data.messageArr.length < this.pageSize) {
        this.isNoData = true;
      }
      this.needScrollToBottom = false;
      this.set_friend_messages([...data.messageArr, ...currentMessage]);
    }
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    this.$nextTick(() => {
      this.messageDom.scrollTop = this.messageDom.scrollHeight;
      this.messageOpacity = 1;
    });
  }

  /**
   * 根据图片url设置图片框宽高, 注意是图片框
   */
  getImageStyle(src: string) {
    const arr = src.split('$');
    let width = Number(arr[2]);
    let height = Number(arr[3]);
    if (this.mobile) {
      // 如果是移动端,图片最大宽度138, 返回值加12是因为设置的是图片框的宽高要加入padding值
      if (width > 138) {
        height = (height * 138) / width;
        width = 138;
        return {
          width: `${width + 12}px`,
          height: `${height + 12}px`,
        };
      }
    }
    return {
      width: `${width + 12}px`,
      height: `${height + 12}px`,
    };
  }

  /**
   * 文本转译/校验
   * @params text
   */
  _parseText(text: string) {
    return parseText(text);
  }

  /**
   * 是否URL
   * @params text
   */
  _isUrl(text: string) {
    return isUrl(text);
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

.message-container {
  overflow: hidden;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: $message-bg-color;
  .message-header {
    height: 60px;
    line-height: 60px;
    z-index: 100;
    background: #f0f0f0;
    border-bottom: 1px solid #d6d6d6;
    .message-header-text {
      color: #2b2b2b;
      font-weight: bold;
      float: left;
      margin-left: 20px;
    }
    .message-header-icon {
      margin-left: 5px;
      color: #2b2b2b;
    }
  }
  .message-loading {
    position: absolute;
    top: 2px;
    right: 50px;
    z-index: 199;
    .message-loading-icon {
      margin: 10px auto;
      font-size: 20px;
      padding: 8px;
      color: #2b2b2b;
    }
  }
  // 移动端样式
  @media screen and (max-width: 768px) {
    .message-main {
      height: calc(100% - 100px) !important;
    }
  }
  .message-main {
    overflow: auto;
    flex: 1;
    position: relative;
    .message-notification {
      ::v-deep .ant-alert-description {
        text-align: left;
        max-height: 22px;
        overflow: auto;
      }
    }
    .message-content {
      .message-content-noData {
        line-height: 50px;
        color: #9d9d9d;
      }
      .message-content-revoke {
        text-align: center;
        color: #9d9d9d;
        font-size: 14px;
        margin: 10px auto;
      }
      .message-content-message {
        text-align: left;
        margin: 10px 20px;
        .message-content-text,
        .message-content-image {
          max-width: 600px;
          display: inline-block;
          margin-left: 35px;
          overflow: hidden;
          margin-top: 4px;
          padding: 6px;
          background-color: white;
          color: #080808;
          font-size: 16px;
          border-radius: 5px;
          text-align: left;
          word-break: break-word;
        }
        .message-content-image {
          max-height: 350px;
          max-width: 350px;
          img {
            cursor: pointer;
            max-width: 335px;
            max-height: 335px;
          }
        }
        .message-content-file {
          cursor: pointer;
          max-width: 600px;
          display: inline-block;
          margin-left: 35px;
          overflow: hidden;
          margin-top: 4px;
          padding: 10px 20px;
          font-weight: 500;
          background-color: white;
          color: #080808;
          font-size: 16px;
          border-radius: 5px;
          text-align: left;
          word-break: break-word;
          .message-content-icon {
            width: 50px;
            height: 50px;
            float: left;
          }
          .message-content-detail {
            float: right;
            margin-left: 20px;
            .file-size {
              font-size: 14px;
              margin-top: 10px;
              color: #8e8e8e;
            }
          }
        }
      }
      .text-right {
        text-align: right !important;
        .avatar {
          justify-content: flex-end;
        }
      }
    }
  }
}

//输入框样式
.ant-input {
  padding: 0 50px 0 50px;
  &:focus {
    box-shadow: none !important;
  }
}
// 消息工具样式
.messagte-tool-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 40px;
  text-align: center;
  line-height: 42px;
  font-size: 16px;
  cursor: pointer;
  z-index: 99;
}
.message-tool-item {
  width: 0px;
  height: 240px;
  cursor: pointer;
  .message-tool-contant {
    width: 50px;
    padding: 5px;
    border-radius: 5px;
    transition: all linear 0.2s;
    .message-tool-item-img {
      width: 40px;
    }
    .message-tool-item-text {
      text-align: center;
      font-size: 10px;
    }
    &:hover {
      background: rgba(135, 206, 235, 0.6);
    }
  }
}

// 移动端样式
@media screen and (max-width: 768px) {
  .message-main {
    .message-content-image {
      img {
        cursor: pointer;
        max-width: 138px !important;
        height: inherit !important;
      }
    }
  }
}
@media screen and (max-width: 500px) {
  .message-header-box {
    .message-header-text {
      display: block;
      width: 36%;
      margin: 0 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .message-header-icon {
      position: absolute;
      top: 17px;
      right: 60px;
      font-size: 25px;
    }
  }
}
.loading-enter-Panel {
  transition: all 0.3s ease;
}
.loading-leave-Panel {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.loading-enter,
.loading-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}

.noData-enter-Panel,
.noData-leave-Panel {
  transition: opacity 1s;
}
.noData-enter,
.noData-leave-to {
  opacity: 0;
}

.transition {
  display: inline-block;
  animation: transition 0.4s ease;
}
@keyframes transition {
  0% {
    transform: translateY(-40px);
    opacity: 0;
  }
  60% {
    transform: translateY(10px);
    opacity: 0.6;
  }
  100% {
    transform: translateY(0px);
    opacity: 1;
  }
}
</style>
