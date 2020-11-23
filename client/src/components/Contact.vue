<!--
 * @file: 通讯录模块
 * @author: BoBo
 * @copyright: NanJing Anshare Tech .Com
 * @Date: 2020-11-22 17:32:28
-->
<template>
  <div class="tree-container">
    <a-tree class="tree" show-line :replace-fields="replaceFields" :tree-data="organizationArr" @select="onTreeSelect"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import axios from 'axios';

@Component
export default class Search extends Vue {
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
    axios.post(this.orgUrl).then((res) => {
      this.organizationArr = res.data.data;
    });
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
.tree-container {
  height: 100%;
  overflow: auto;
  text-align: left;
  background: #fbfbfb;
  .tree {
    .ant-tree-title {
      color: white;
    }
  }
}
</style>
