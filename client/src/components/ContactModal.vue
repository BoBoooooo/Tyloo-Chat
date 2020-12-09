<!--
 * @file: 添加群成员
 * @author: BoBo
 * @copyright: NanJing Anshare Tech .Com
 * @Date: 2020-12-08 16:15:10
-->
<template>
  <a-modal title="选择联系人" app :visible="showContactDialog" footer="" @cancel="cancelEvent">
    <a-transfer
      class="tree-transfer"
      :data-source="dataSource"
      :target-keys="targetKeys"
      show-search
      :filter-option="filterOption"
      :render="(item) => item.title"
      :show-select-all="false"
      @change="onChange"
    >
      <template slot="children" slot-scope="{ props: { direction, selectedKeys }, on: { itemSelect } }">
        <a-tree
          v-if="direction === 'left'"
          blockNode
          checkable
          checkStrictly
          defaultExpandAll
          :checkedKeys="[...selectedKeys, ...targetKeys]"
          :treeData="treeData"
          show-icon
          @check="
            (_, props) => {
              onChecked(_, props, [...selectedKeys, ...targetKeys], itemSelect);
            }
          "
          @select="
            (_, props) => {
              onChecked(_, props, [...selectedKeys, ...targetKeys], itemSelect);
            }
          "
        >
        </a-tree>
      </template>
      <template slot="footer" slot-scope="props">
        <template v-if="props.direction === 'right'">
          <a-button type="primary" slot="footer" size="small" style="float:right;margin: 5px" @click="onSubmit">
            添加
          </a-button>
          <a-button slot="footer" size="small" style="float:right;margin: 5px" @click="showContactDialog = false">
            取消
          </a-button>
        </template>
      </template>
    </a-transfer>
  </a-modal>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import cnchar from 'cnchar';

const chatModule = namespace('chat');
const appModule = namespace('app');

function isChecked(selectedKeys: any, eventKey: any) {
  return selectedKeys.indexOf(eventKey) !== -1;
}

function handleTreeData(data: any, targetKeys: any = []) {
  data.forEach((item: any) => {
    // eslint-disable-next-line no-param-reassign
    item.disabled = targetKeys.includes(item.key) || item.disabled;
    if (item.children) {
      handleTreeData(item.children, targetKeys);
    }
  });
  return data;
}

@Component
export default class ContactModal extends Vue {
  @chatModule.Getter('friendGather') friendGather: FriendGather;

  @chatModule.Getter('socket') socket: SocketIOClient.Socket;

  @chatModule.Action('inviteUsersInfoGroup') inviteUsersInfoGroup: Function;

  @chatModule.State('activeRoom') activeRoom: Group & Friend;

  @appModule.Getter('user') user: User;

  @Prop({ default: () => [], type: Array }) groupUserList: Array<User>;

  targetKeys = [];

  // 添加成员dialog
  showContactDialog: boolean = false;

  filterOption(inputValue: any, option: any) {
    return option.title.indexOf(inputValue) > -1;
  }

  showDialog() {
    this.showContactDialog = true;
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
    const contactList = [] as any;
    // eslint-disable-next-line no-restricted-syntax
    for (const char of Array.from(new Set(charList))) {
      // eslint-disable-next-line no-restricted-syntax
      contactList.push({
        key: char,
        title: char,
        disabled: true,
        children: list
          .filter(
            k => cnchar
              .spell(k.username)
              .toString()
              .charAt(0)
              .toUpperCase() === char,
          )
          .map(t => ({
            key: t.userId,
            title: t.username,
            avatar: t.avatar,
            disabled: this.groupUserList.some(user => user.userId === t.userId),
          })),
      });
    }
    return contactList;
  }

  get dataSource() {
    const transferDataSource: any = [];
    // 数组扁平化
    function flatten(list: any = []) {
      list.forEach((item: any) => {
        // eslint-disable-next-line no-param-reassign
        delete item.disabled;
        if (!item.children) {
          transferDataSource.push(item);
        }
        if (item.children) {
          flatten(item.children);
        }
      });
    }
    flatten(JSON.parse(JSON.stringify(this.treeData)));
    return transferDataSource;
  }

  get treeData() {
    return handleTreeData(this.contactList, this.targetKeys);
  }

  onSubmit() {
    if (this.targetKeys.length === 0) {
      this.$message.warning('请选择联系人');
    }
    this.socket.emit('inviteUsersInfoGroup', {
      friendIds: this.targetKeys,
      groupId: this.activeRoom.groupId,
      userId: this.user.userId,
    });
  }

  onChange(targetKeys: any) {
    console.log('Target Keys:', targetKeys);
    this.targetKeys = targetKeys;
  }

  onChecked(_: any, e: any, checkedKeys: any, itemSelect: any) {
    const { eventKey } = e.node;
    itemSelect(eventKey, !isChecked(checkedKeys, eventKey));
  }

  cancelEvent() {
    this.showContactDialog = false;
    this.targetKeys = [];
  }
}
</script>
<style scoped>
.tree-transfer .ant-transfer-list:first-child {
  width: 50%;
  flex: none;
}
</style>
