<!--
 * @file: 通讯录模块
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-11-22 17:32:28
-->
<template>
  <a-collapse>
    <a-collapse-panel key="contact" header="联系人" v-if="visibleList.contact">
      <div class="contact-container">
        <div class="contact-list" v-for="(value, key, index) in contactList" :key="index">
          <span class="contact-letter">{{ key }}</span>
          <div class="contact-box" v-for="(friend, sindex) in value" :key="sindex" @click="chooseObject(friend)">
            <a-avatar :src="apiUrl + friend.avatar" class="contact-avatar" :size="40"></a-avatar>
            <span class="contact-name">{{ friend.username }}</span>
          </div>
        </div>
      </div>
    </a-collapse-panel>
    <a-collapse-panel key="organization" header="组织架构" v-if="organizationArr.length > 0 && visibleList.organization">
      <!-- 此处嵌入第三方组织架构目录 -->
      <div class="tree-container">
        <a-tree show-line :replace-fields="replaceFields" :tree-data="organizationArr" @select="onTreeSelect" />
      </div>
    </a-collapse-panel>
    <a-collapse-panel key="group" header="群组" v-if="visibleList.group">
      <div class="contact-container" style="padding-top: 0">
        <div class="contact-list" v-for="(group, index) in groupList" :key="index">
          <div class="contact-box" @click="chooseObject(group)">
            <img class="contact-avatar" src="~@/assets/group.png" alt="" />
            <span class="contact-name">{{ group.groupName }}</span>
          </div>
        </div>
      </div>
    </a-collapse-panel>
  </a-collapse>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import cnchar from 'cnchar';
import axios from 'axios';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component
export default class Contact extends Vue {
  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Mutation('set_active_room') _setActiveRoom: Function;

  @appModule.Mutation('set_activeTabName') _setActiveTabName: Function;

  @appModule.Getter('user') user: User;

  @appModule.Getter('apiUrl') apiUrl: string;

  @Prop({
    type: Object,
    default: () => ({
      contact: true,
      organization: true,
      group: true,
    }),
  })
  visibleList: Object;

  friend: FriendMap = {
    friendId: '',
    friendUserName: '',
  };

  userArr: Array<User> = [];

  searchData: Array<Group | Friend> = [];

  // 组织架构
  organizationArr: Array<any> = [];

  replaceFields = {
    children: 'children',
    title: 'label',
    key: 'id',
  };

  created() {
    // 根据环境变量判断是否需要请求第三方组织架构
    if (process.env.VUE_APP_ORG_URL) {
      axios.post(process.env.VUE_APP_ORG_URL).then((res) => {
        this.organizationArr = res.data.data;
      });
    }
  }

  // 获取联系人列表,按A-Z字母排序
  get contactList() {
    const list = Object.values(this.friendGather);
    // 此处拿到所有好友拼音首字母,使用cnchar插件
    // https://github.com/theajack/cnchar
    const charList = list.map((k) => cnchar.spell(k.username).toString().charAt(0).toUpperCase()).sort();
    const contactObj = {} as any;
    // eslint-disable-next-line no-restricted-syntax
    for (const char of Array.from(new Set(charList))) {
      // eslint-disable-next-line no-restricted-syntax
      contactObj[char] = list.filter((k) => cnchar.spell(k.username).toString().charAt(0).toUpperCase() === char);
    }
    return contactObj;
  }

  // 获取群组列表
  get groupList() {
    const list = Object.values(this.groupGather);
    return list;
  }

  onTreeSelect(selectedKeys: any, info: any) {
    const {
      node: {
        dataRef: { parentid, id, label },
      },
    } = info;
    // 如果parentid为null表示为叶子结点(即用户)
    if (!parentid) {
      this.friend.friendId = id;
      this.friend.friendUserName = label;
      this.addFriend();
      this._setActiveTabName('message');
    }
  }

  async chooseObject(chat: Friend | Group) {
    const { userId } = this.user;
    const chatId = (chat as Group).groupId || chat.userId;
    // 激活聊天窗口,如果已删除需要重新恢复
    let deletedChat = (await this.$localforage.getItem(`${userId}-deletedChatId`)) as string[];
    if (Array.isArray(deletedChat)) {
      deletedChat = deletedChat.filter((id) => id !== chatId);
      await this.$localforage.setItem(`${userId}-deletedChatId`, deletedChat);
    }
    this._setActiveTabName('message');

    this._setActiveRoom(chat);
  }

  addFriend() {
    this.$emit('addFriend', this.friend);
    this.friend = {
      friendId: '',
      friendUserName: '',
    };
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme';

$font-size: 16px;
$color: #6f6f6f;
.contact-container {
  height: 100%;
  overflow: auto;
  text-align: left;
  padding: 5px 20px;
  background: $room-bg-color;
  .contact-list {
    .contact-letter {
      color: $color;
      display: inline-block;
      width: 100%;
      padding-left: 10px;
      font-size: $font-size;
      border-bottom: 1px solid rgb(198, 198, 198);
    }
    .contact-box {
      padding: 10px 25px 10px 20px;
      margin: 0 -20px;
      text-overflow: ellipsis; //溢出用省略号显示
      white-space: nowrap; //溢出不换行
      overflow: hidden;
      cursor: pointer;
      &:hover {
        background: #d6d6d6;
      }
      .contact-name {
        margin-left: 10px;
        color: #080808;
      }
      .contact-avatar {
        border-radius: 0 !important;
        width: 40px;
      }
    }
  }
}
.tree-container {
  text-align: left;
  padding-left: 20px;
}
</style>
