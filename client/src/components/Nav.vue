<!--
 * @file: 左侧导航栏功能按钮
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
-->
<template>
  <div class="tool">
    <div class="tool-panel">
      <div class="close"></div>
      <div class="zoom-in"></div>
      <div class="zoom-out"></div>
    </div>
    <!-- 顶部头像区域 -->
    <div class="tool-avatar">
      <div class="tool-avatar-img" @click="showUserInfo('showUserModal')">
        <a-tooltip v-if="user" placement="left" arrow-point-at-center :title="user.username">
          <img :src="apiUrl + user.avatar" alt="" />
        </a-tooltip>
      </div>
    </div>
    <!-- 底部工具栏 -->
    <a-tooltip placement="topLeft" arrow-point-at-center>
      <div slot="title">
        <div>qq群289438105~</div>
        <div>觉得还不错的话可以Star鼓励一下~</div>
        <div>截图粘贴可发送图片</div>
      </div>
      <a-icon type="bulb" class="tool-tip icon" />
    </a-tooltip>
    <!-- 消息列表/通讯录切换 -->
    <a-tooltip placement="left" title="消息列表" arrow-point-at-center>
      <a-icon
        type="wechat"
        theme="filled"
        class="tool-message icon"
        :class="{
          'tool-active': activeTabName === 'message',
        }"
        @click="setActiveTabName('message')"
      />
    </a-tooltip>
    <a-tooltip placement="left" theme="filled" title="通讯录" arrow-point-at-center>
      <a-icon
        :class="{
          'tool-active': activeTabName === 'contacts',
        }"
        type="team"
        class="tool-contacts icon"
        @click="setActiveTabName('contacts')"
      />
    </a-tooltip>
    <a-icon type="skin" class="tool-skin icon" @click="showBackgroundModal = true" />
    <a v-if="isDemo" href="https://github.com/BoBoooooo/tyloo-chat" target="_blank" class="tool-github icon"><a-icon type="github" /></a>
    <a-icon class="tool-out icon" type="poweroff" @click="logout" />
    <a-modal title="用户信息" :visible="showUserModal" footer="" @cancel="showUserModal = false">
      <div class="tool-user">
        <div
          @mouseover="showUpload = true"
          @mouseleave="showUpload = false"
          class="tool-user-avatar"
          :class="{ active: showUpload || uploading }"
        >
          <a-avatar :src="apiUrl + user.avatar" class="img" :size="120"></a-avatar>
          <a-upload v-if="showUpload && !uploading" class="tool-user-upload" :show-upload-list="false" :before-upload="beforeUpload">
            <div class="text">
              <a-icon type="upload" style="margin-right: 4px" />
              <span>更换头像</span>
            </div>
          </a-upload>
          <a-icon class="loading" v-if="uploading" type="loading" spin />
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">更改用户名</div>
          <a-input class="tool-user-input" v-model="username" placeholder="请输入新用户名"></a-input>
          <a-button type="primary" @click="changeUserName">确认</a-button>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">更改密码</div>
          <a-input-password class="tool-user-input" v-model="password" placeholder="请输入新密码"></a-input-password>
          <a-button type="primary" @click="changePassword">确认</a-button>
        </div>
      </div>
    </a-modal>
    <a-modal title="主题" :visible="showBackgroundModal" footer="" @cancel="showBackgroundModal = false">
      <div class="tool-user-info">
        <div class="tool-user-title" style="width: 65px">
          <span>背景图</span>
          <a-tooltip placement="topLeft" arrow-point-at-center>
            <div slot="title">
              <span>输入空格时为默认背景, 支持 jpg, png, gif等格式</span>
            </div>
            <a-icon type="exclamation-circle" style="margin-left: 5px" />
          </a-tooltip>
        </div>
        <a-input v-model="background" class="tool-user-input" placeholder="请输入背景图片网址"></a-input>
        <a-button type="primary" @click="changeBackground">确认</a-button>
      </div>
      <div class="tool-recommend">
        <div class="recommend" v-for="(theme, index) in themes" :key="index" @click="setBackground(theme.url)">
          <img :src="theme.url" alt="" />
          <span class="text">{{ theme.name }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { setUserAvatar } from '@/api/apis';
import { DEFAULT_BACKGROUND } from '@/common/index';
import { namespace } from 'vuex-class';
import * as apis from '@/api/apis';
import { processReturn, nameVerify, passwordVerify } from '@/utils/common';
import themes from '@/common/theme';

const appModule = namespace('app');
const chatModule = namespace('chat');

@Component
export default class Tool extends Vue {
  @appModule.Getter('user') user: User;

  @appModule.Getter('apiUrl') apiUrl: string;

  @appModule.Getter('token') token: string;

  @appModule.Getter('activeTabName') activeTabName: string;

  @appModule.Mutation('set_background') setBackground: Function;

  @appModule.Mutation('set_user') setUser: Function;

  @appModule.Mutation('set_activeTabName') setActiveTabName: Function;

  @chatModule.Getter('socket') socket: SocketIOClient.Socket;

  @chatModule.Mutation('set_user_gather') setUserGather: Function;

  showUpload: boolean = false;

  showUserModal: boolean = false;

  showBackgroundModal: boolean = false;

  username: string = '';

  password: string = '';

  background: string = '';

  uploading: boolean = false;

  avatar: any = '';

  themes: {
    name: string;
    url: string;
  }[] = themes;

  @Watch('user')
  userChange() {
    this.username = this.user.username;
  }

  @Watch('activeTabName')
  activeTabNameChange(val: string) {
    this.setActiveTabName(val);
  }

  created() {
    this.username = this.user.username;
  }

  logout() {
    this.$emit('logout');
  }

  showUserInfo() {
    this.username = this.user.username;
    this.showUserModal = true;
  }

  async changeUserName() {
    if (!nameVerify(this.username)) {
      return;
    }
    const res = await apis.patchUserName(this.username);
    const data = processReturn(res);
    if (data) {
      console.log(data);
      this.setUser(data);
      this.setUserGather(data);
      // 通知其他用户个人信息改变
      this.socket.emit('updateUserInfo', data.userId);
    }
  }

  async changePassword() {
    if (!passwordVerify(this.password)) {
      return;
    }
    const res = await apis.patchPassword(this.password);
    const data = processReturn(res);
    if (data) {
      this.setUser(data);
      this.setUserGather(data);
    }
  }

  beforeUpload(file: any) {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      return this.$message.error('请上传jpeg/jpg/png/gif格式的图片!');
    }
    const isLt1M = file.size / 1024 / 1024 < 0.5;
    if (!isLt1M) {
      return this.$message.error('图片必须小于500K!');
    }
    this.avatar = file;
    this.handleUpload();
    return false;
  }

  async handleUpload() {
    this.uploading = true;
    const formData = new FormData();
    formData.append('avatar', this.avatar);
    const data = processReturn(await setUserAvatar(formData));
    if (data) {
      this.setUser(data);
      this.setUserGather(data);
      this.uploading = false;
      this.showUpload = false;
      // 通知其他用户个人信息改变
      this.socket.emit('updateUserInfo', data.userId);
    }
  }

  changeBackground() {
    if (!this.background.trim().length) {
      this.setBackground(DEFAULT_BACKGROUND);
    } else {
      this.setBackground(this.background);
    }
    this.showBackgroundModal = false;
  }

  get isDemo() {
    return window.location.host.includes('server.boboooooo.top:9999') || process.env.NODE_ENV === 'development';
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

.tool {
  padding: 10px 5px 10px;
  height: 98%;
  position: relative;
  .tool-panel {
    justify-content: space-around;
    align-items: center;
    display: flex;
    .close,
    .zoom-in,
    .zoom-out {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ff544d;
      cursor: pointer;
      position: relative;
      &:hover {
        &::after {
          position: absolute;
          content: '';
          top: 5px;
          left: 3px;
          width: 6px;
          height: 2px;
          background: #080808;
        }
      }
    }
    .zoom-in {
      background: #feb429;
    }
    .zoom-out {
      background: #24c138;
    }
  }
  .tool-active {
    color: $primary-color !important;
  }
  .tool-avatar {
    margin-top: 30px;
    .tool-avatar-img {
      margin: 0 auto;
      width: 55px;
      height: 55px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 2s;
        &:hover {
          transform: rotate(360deg);
        }
      }
    }
  }
  .tool-tip {
    // bottom: 190px;
    bottom: 130px;
  }
  .tool-skin {
    // bottom: 130px;
    bottom: 70px;
  }
  .tool-github {
    color: rgba(255, 255, 255, 0.85);
    bottom: 190px;
  }
  .tool-message {
    top: 150px;
  }
  .tool-contacts {
    top: 210px;
  }
  .tool-out {
    bottom: 10px;
  }
  .icon {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 25px;
    color: white;
    font-size: 25px;
    cursor: pointer;
    z-index: 100;
    &:hover {
      color: $primary-color;
    }
  }
}

.tool-user {
  text-align: center;
  font-size: 16px;
  .tool-user-avatar {
    position: relative;
    width: 120px;
    overflow: hidden;
    margin: 0 auto 24px;
    border-radius: 50%;
    cursor: pointer;
    .tool-user-upload {
      .text {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        line-height: 120px;
        font-weight: bold;
      }
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      margin: -18px 0 0 -18px;
      font-size: 35px;
      font-weight: bold;
      color: #fff;
    }
    .img {
      transition: 0.2s all linear;
    }
    &.active {
      .img {
        filter: blur(3px);
      }
    }
  }
}
.tool-user-info {
  display: flex;
  justify-content: left;
  align-items: center;
  .tool-user-input {
    flex: 1;
    margin-right: 5px;
  }
  .tool-user-title {
    display: flex;
    align-items: center;
    width: 90px;
    text-align: left;
    font-weight: bold;
    word-break: keep-all;
    margin-right: 15px;
  }
  &:nth-child(2) {
    margin-bottom: 15px;
  }
}

.tool-recommend {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  .recommend {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    width: 100px;
    height: 100px;
    margin: 15px 10px 0;
    overflow: hidden;
    cursor: pointer;
    transition: 0.3s all linear;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    span {
      position: absolute;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 600;
      transition: 0.3s all linear;
      opacity: 0;
    }
    &:hover {
      box-shadow: 1px 5px 10px gray;
      span {
        opacity: 1;
      }
    }
  }
}

@media screen and (max-width: 788px) {
  .tool-recommend {
    font-size: 12px;
    .recommend {
      width: 80px;
      height: 80px;
    }
  }
}
</style>
