<!--
 * @file: 发送消息输入框
 * @copyright: NanJing Anshare Tech .Com
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="message-input" v-if="activeRoom">
    <div class="message-tool">
      <a-popover placement="topLeft" trigger="click" class="message-popver">
        <template slot="content">
          <emoji @addEmoji="addEmoji"></emoji>
        </template>
        <div class="message-tool-item">
          <a-icon type="smile" />
        </div>
      </a-popover>
      <div class="message-tool-item">
        <a-upload :show-upload-list="false" :before-upload="beforeFileUpload">
          <a-icon type="folder-open" />
        </a-upload>
      </div>
    </div>
    <a-textarea
      autocomplete="off"
      v-model="text"
      ref="input"
      autoFocus
      style="color:#000;"
      @pressEnter="
        (e) => {
          // 此处拦截enter后光标换行
          e.preventDefault();
          throttle(preSendMessage);
        }
      "
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Emoji from './Emoji.vue';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    Emoji,
  },
})
export default class Entry extends Vue {
  @appModule.Getter('user') user: User;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @chatModule.Getter('socket') socket: SocketIOClient.Socket;

  @chatModule.Getter('dropped') dropped: boolean;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Getter('userGather') userGather: FriendGather;

  text: string = '';

  lastTime: number = 0;

  mounted() {
    this.initPaste();
    this.focusInput();
  }

  /**
   * 点击切换房间进入此方法
   */
  @Watch('activeRoom')
  changeActiveRoom() {
    this.$nextTick(() => {
      this.focusInput();
    });
  }

  /**
   * 监听图片粘贴事件
   */
  initPaste() {
    document.addEventListener('paste', (event) => {
      const items = event.clipboardData && event.clipboardData.items;
      let file = null;
      if (items && items.length) {
        // 检索剪切板items
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            file = items[i].getAsFile();
            break;
          }
        }
      }
      if (file) {
        this.throttle(this.handleUpload, file);
      }
    });
  }

  /**
   * 消息发送节流
   */
  throttle(fn: Function, file?: File) {
    const nowTime = +new Date();
    console.log(this.lastTime);
    console.log(nowTime);
    if (nowTime - this.lastTime < 200) {
      return this.$message.error('消息发送太频繁！');
    }
    fn(file);
    this.lastTime = nowTime;
  }

  /**
   * 消息发送前校验
   */
  preSendMessage() {
    if (!this.text.trim()) {
      this.$message.error('不能发送空消息!');
      return;
    }
    if (this.text.length > 220) {
      this.$message.error('消息太长!');
      return;
    }
    console.log(this.text);
    if (this.activeRoom.groupId) {
      this.sendMessage({ type: 'group', message: this.text, messageType: 'text' });
    } else {
      this.sendMessage({ type: 'friend', message: this.text, messageType: 'text' });
    }
    this.text = '';
  }

  /**
   * 消息发送
   */
  sendMessage(data: SendMessage) {
    if (data.type === 'group') {
      this.socket.emit('groupMessage', {
        userId: this.user.userId,
        groupId: this.activeRoom.groupId,
        content: data.message,
        width: data.width,
        height: data.height,
        fileName: data.fileName,
        messageType: data.messageType,
        size: data.size,
      });
    } else {
      this.socket.emit('friendMessage', {
        userId: this.user.userId,
        friendId: this.activeRoom.userId,
        content: data.message,
        width: data.width,
        height: data.height,
        fileName: data.fileName,
        messageType: data.messageType,
        size: data.size,
      });
    }
  }

  /**
   * 添加emoji到input
   */
  addEmoji(emoji: string) {
    const myField = (this.$refs.input as Vue).$el as HTMLFormElement;
    if (myField.selectionStart || myField.selectionStart === '0') {
      // 得到光标前的位置
      const startPos = myField.selectionStart;
      // 得到光标后的位置
      const endPos = myField.selectionEnd;
      // 在加入数据之前获得滚动条的高度
      const restoreTop = myField.scrollTop;
      this.text = this.text.substring(0, startPos) + emoji + this.text.substring(endPos, this.text.length);
      // 如果滚动条高度大于0
      if (restoreTop > 0) {
        // 返回
        myField.scrollTop = restoreTop;
      }
      myField.focus();
      // 设置光标位置
      const position = startPos + emoji.length;
      if (myField.setSelectionRange) {
        myField.focus();
        setTimeout(() => {
          myField.setSelectionRange(position, position);
        }, 10);
      } else if (myField.createTextRange) {
        const range = myField.createTextRange();
        range.collapse(true);
        range.moveEnd('character', position);
        range.moveStart('character', position);
        range.select();
      }
    } else {
      this.text += emoji;
      myField.focus();
    }
  }


  /**
   * focus input框
   */
  focusInput() {
    // @ts-ignore
    this.$refs.input.focus();
  }

  /**
   * 计算图片的比例
   */
  getImageSize(data: ImageSize) {
    let { width, height } = data;
    if (width > 335 || height > 335) {
      if (width > height) {
        height = 335 * (height / width);
        width = 335;
      } else {
        width = 335 * (width / height);
        height = 335;
      }
    }
    return {
      width,
      height,
    };
  }

  /**
   * 附件上传校验
   * @params file
   */
  beforeFileUpload(file: File) {
    this.throttle(this.handleUpload, file);
    return false;
  }

  /**
   * 上传附件/图片发送
   * @params file
   */
  async handleUpload(file: File) {
    let messageType:string;
    if (file.type.includes('image')) {
      messageType = 'image';
    } else if (file.type.includes('video')) {
      messageType = 'video';
    } else {
      messageType = 'file';
    }
    const maxSize = messageType === 'image' ? 0.5 : 20;
    const isLt1M = file.size / 1024 / 1024 < maxSize;
    if (!isLt1M) {
      return this.$message.error(messageType === 'image' ? '图片必须小于500K!' : '文件必须小于20M!');
    }
    if (messageType === 'image') {
      const image = new Image();
      const url = window.URL || window.webkitURL;
      image.src = url.createObjectURL(file);
      image.onload = () => {
        const imageSize: ImageSize = this.getImageSize({ width: image.width, height: image.height });
        this.sendMessage({
          type: this.activeRoom.groupId ? 'group' : 'friend',
          message: file,
          width: imageSize.width,
          height: imageSize.height,
          messageType,
        });
      };
    } else {
      // 如果上传附件的为图片则类型为image,其他附件为file/video类型
      console.log(messageType);
      this.sendMessage({
        type: this.activeRoom.groupId ? 'group' : 'friend',
        message: file,
        messageType,
        fileName: file.name,
        size: file.size,
      });
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

.message-input {
  display: flex;
  // border-top: 1px solid #d1d1d1;
  background: $message-bg-color;
  flex-wrap: nowrap;
  width: 100%;
  textarea {
    border-left: none !important;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  .message-input-button {
    width: 30px;
    cursor: pointer;
    position: absolute;
    right: 10px;
    top: 4px;
  }
}
//输入框样式
.ant-input {
  padding: 50px 10px 0 20px !important;
  height: 180px;
  border-top: 1px solid #d6d6d6;
  background: $message-bg-color;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 0;
  &:focus {
    box-shadow: none !important;
  }
}

// 移动端样式
@media screen and (max-width: 768px) {
  .ant-input {
    padding: 0 50px 0 35px !important;
    height: 40px;
  }
  .message-tool {
    right: unset!important;
    padding: 0 0 0 10px !important;
    .message-tool-item{
       .anticon{
         margin-right: 0!important;
       }
    }
  }
}

// 消息工具样式
.message-tool {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  height: 50px;
  line-height: 42px;
  font-size: 22px;
  padding: 0 20px;
  z-index: 99;
  color: #828282;
  .message-tool-item {
    .anticon {
      margin-right: 25px ;
    }
  }
}
</style>
