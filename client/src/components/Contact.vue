<!--
 * @file: 通讯录模块
 * @author: BoBo
 * @copyright: NanJing Anshare Tech .Com
 * @Date: 2020-11-22 17:32:28
-->
<template>
  <div class="contact-container">
    <div class="contact-list" v-for="(value, key, index) in contactList" :key="index">
      <span class="contact-letter">{{ key }}</span>
      <div class="contact-box" v-for="(friend, sindex) in value" :key="sindex">
        <a-avatar :src="friend.avatar" class="contact-avatar" :size="40"></a-avatar>

        <span class="contact-name">{{ friend.username }}</span>
      </div>
    </div>
    <!-- 此处嵌入第三方组织架构目录 -->
    <div class="tree-container" v-if="organizationArr.length > 0">
      <a-tree show-line :replace-fields="replaceFields" :tree-data="organizationArr" @select="onTreeSelect" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import axios from 'axios';
import cnchar from 'cnchar';

const chatModule = namespace('chat');

@Component
export default class Contact extends Vue {
  @chatModule.Getter('friendGather') friendGather: FriendGather;

  friend: FriendMap = {};

  userArr: Array<User> = [];

  searchData: Array<Group | Friend> = [];

  // 组织架构
  organizationArr: Array<any> = [];

  // 组织架构API_URL
  orgUrl: string = 'http://116.62.78.229:8082/FlowWJBackend/dept/treeDeptUsers';

  replaceFields = {
    children: 'children',
    title: 'label',
    key: 'id',
  };

  created() {
    if (!window.location.host.includes('server.boboooooo.top:9999')) {
      axios.post(this.orgUrl).then((res) => {
        this.organizationArr = res.data.data;
      });
    }
  }

  // 获取联系人列表,按A-Z字母排序
  get contactList() {
    const list = Object.values(this.friendGather);
    // 此处拿到所有好友拼音首字母,使用cnchar插件
    // https://github.com/theajack/cnchar
    const charList = list
      .map(k => cnchar
        .spell(k.username)
        .toString()
        .charAt(0)
        .toUpperCase())
      .sort();
    const contactObj = {} as any;
    // eslint-disable-next-line no-restricted-syntax
    for (const char of charList) {
      // eslint-disable-next-line no-restricted-syntax
      contactObj[char] = list.filter(
        k => cnchar
          .spell(k.username)
          .toString()
          .charAt(0)
          .toUpperCase() === char,
      );
    }
    return contactObj;
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
    }
  }

  addFriend() {
    this.$emit('addFriend', this.friend);
    // this.$emit('setActiveRoom', {
    //   userId: this.friend.friendId,
    //   username: this.friend.friendUserName,
    // });

    this.friend = {};
  }
}
</script>

<style lang="scss" scoped>
$font-size: 16px;
$color: #6f6f6f;
.contact-container {
  height: 100%;
  overflow: auto;
  text-align: left;
  padding: 20px;
  background: #fbfbfb;
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
      padding: 10px 20px;
      margin: 0 -20px;
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
      }
    }
  }
  .tree-container {
    border-top: 1px solid rgb(198, 198, 198);
  }
}
</style>
