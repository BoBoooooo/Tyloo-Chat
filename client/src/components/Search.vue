<template>
  <div class="search">
    <div class="search-select">
      <a-select
        show-search
        size="small"
        placeholder="搜索聊天组"
        :default-active-first-option="false"
        :show-arrow="false"
        :filter-option="false"
        :not-found-content="null"
        @search="handleSearch"
      >
        <a-icon slot="suffixIcon" type="search" />
        <a-select-option v-for="(chat, index) in searchData" :key="index" @click="selectChat(chat)">
          <div v-if="chat.username">{{ chat.username }}</div>
          <div v-if="chat.groupName">{{ chat.groupName }}</div>
        </a-select-option>
      </a-select>

      <a-dropdown class="search-dropdown">
        <a-icon type="plus-square" class="search-dropdown-button" />
        <a-menu slot="overlay">
          <a-menu-item>
            <div @click="() => (visibleAddGroup = !visibleAddGroup)">创建群</div>
          </a-menu-item>
          <a-menu-item>
            <div @click="() => (visibleJoinGroup = !visibleJoinGroup)">搜索群</div>
          </a-menu-item>
          <a-menu-item>
            <div @click="() => (visibleAddFriend = !visibleAddFriend)">搜索用户</div>
          </a-menu-item>
        </a-menu>
      </a-dropdown>
    </div>

    <a-modal v-model="visibleAddGroup" footer="" title="创建群聊">
      <div style="display: flex">
        <a-input v-model="groupName" placeholder="请输入群名字"></a-input>
        <a-button @click="addGroup" :loadig="loading" type="primary">确定</a-button>
      </div>
    </a-modal>
    <a-modal v-model="visibleJoinGroup" footer="" title="搜索群组">
      <div style="display: flex" v-if="visibleJoinGroup">
        <a-select
          show-search
          placeholder="请输入群名字"
          style="width: 90%"
          :default-active-first-option="false"
          :show-arrow="false"
          :filter-option="false"
          :not-found-content="null"
          @search="handleGroupSearch"
          @change="handleGroupChange"
        >
          <a-select-option v-for="(group, index) in groupArr" :key="index" @click="handleGroupSelect(group)">
            <div>{{ group.groupName }}</div>
          </a-select-option>
        </a-select>
        <a-button @click="joinGroup" type="primary" :loading="loading">加入群</a-button>
      </div>
    </a-modal>
    <a-modal v-model="visibleAddFriend" footer="" title="创建聊天/搜索用户">
      <div style="display: flex" v-if="visibleAddFriend">
        <a-select
          show-search
          placeholder="请输入用户名"
          style="width: 90%"
          :default-active-first-option="false"
          :show-arrow="false"
          :filter-option="false"
          :not-found-content="null"
          @search="handleUserSearch"
          @change="handleUserChange"
        >
          <a-select-option v-for="(user, index) in userArr" :key="index" @click="handleUserSelect(user)">
            <div>{{ user.username }}</div>
          </a-select-option>
        </a-select>
        <a-button @click="addFriend" type="primary" :loading="loading">添加好友</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { isContainStr, processReturn, nameVerify } from '@/utils/common';
import * as apis from '@/api/apis';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component
export default class Search extends Vue {
  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @appModule.Getter('loading') loading: boolean;

  @chatModule.Getter('groupGather') groupGather: GroupGather;

  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @appModule.Mutation('set_loading') setLoading: Function;

  visibleAddGroup: boolean = false;

  visibleJoinGroup: boolean = false;

  visibleAddFriend: boolean = false;

  groupName: string = '';

  searchData: Array<Group | Friend> = [];

  groupId: string = '';

  groupArr: Array<Group> = [];

  friend: FriendMap = {
    friendId: '',
    friendUserName: '',
  };

  userArr: Array<User> = [];

  created() {
    this.getSearchData();
  }

  @Watch('groupGather')
  changeGroupGather() {
    this.getSearchData();
  }

  @Watch('friendGather')
  changeFriendGather() {
    this.getSearchData();
  }

  getSearchData() {
    this.searchData = [...Object.values(this.groupGather), ...Object.values(this.friendGather)];
  }

  handleSearch(value: string) {
    const mySearchData = [];
    this.searchData = [...Object.values(this.groupGather), ...Object.values(this.friendGather)];
    // eslint-disable-next-line no-restricted-syntax
    for (const chat of this.searchData) {
      if ((chat as Friend).username) {
        if (isContainStr(value, (chat as Friend).username)) {
          mySearchData.push(chat);
        }
      } else if (isContainStr(value, (chat as Group).groupName)) {
        mySearchData.push(chat);
      }
    }
    this.searchData = mySearchData;
  }

  async handleGroupSearch(value: string) {
    if (!value) {
      return;
    }
    const res = await apis.getGroupsByName(value);
    const data = processReturn(res);
    this.groupArr = data;
  }

  handleGroupSelect(group: Group) {
    this.groupId = group.groupId;
  }

  handleGroupChange() {
    this.groupArr = [];
  }

  async handleUserSearch(value: string) {
    if (!value) {
      return;
    }
    const res = await apis.getUsersByName(value);
    const data = processReturn(res);
    this.userArr = data;
  }

  handleUserSelect(friend: Friend) {
    this.friend.friendId = friend.userId;
  }

  handleUserChange() {
    this.userArr = [];
  }

  selectChat(activeRoom: User & Group) {
    this.$emit('setActiveRoom', activeRoom);
  }

  addGroup() {
    this.setLoading(true);
    this.visibleAddGroup = false;
    if (!nameVerify(this.groupName)) {
      this.visibleAddGroup = true;
      return;
    }
    this.$emit('addGroup', this.groupName);
    this.groupName = '';
  }

  joinGroup() {
    this.setLoading(true);
    this.visibleJoinGroup = false;
    this.$emit('joinGroup', this.groupId);
    this.groupId = '';
  }

  addFriend() {
    this.setLoading(true);
    this.visibleAddFriend = false;
    this.$emit('addFriend', this.friend);
    this.friend = {
      friendUserName: '',
      friendId: '',
    };
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/theme';

.search {
  background: $room-bg-color;
  position: relative;
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  .search-select {
    width: 80%;
    .ant-select {
      width: 100%;
    }
  }
  .search-dropdown {
    position: absolute;
    right: 15px;
    top: 13px;
    font-size: 20px;
    padding: 0;
    cursor: pointer;
    line-height: 40px;
    color: gray;
    transition: 0.2s all linear;
    border-radius: 4px;
    &:hover {
      color: $primary-color;
    }
  }
}
</style>
