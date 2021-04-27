/*
 * @file: 按需引入antd
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
 */
import Vue from 'vue';
import 'ant-design-vue/dist/antd.less';
import {
  message,
  Button,
  Input,
  Modal,
  Form,
  Checkbox,
  Icon,
  Tabs,
  Popover,
  Dropdown,
  Menu,
  Avatar,
  Card,
  Select,
  Upload,
  Tooltip,
  Drawer,
  Popconfirm,
  Badge,
  Tree,
  Collapse,
  Transfer,
  ConfigProvider,
  Alert,
} from 'ant-design-vue';

Vue.use(Avatar);
Vue.use(Button);
Vue.use(Input);
Vue.use(Modal);
Vue.use(Form);
Vue.use(Checkbox);
Vue.use(Icon);
Vue.use(Tabs);
Vue.use(Popover);
Vue.use(Dropdown);
Vue.use(Menu);
Vue.use(Card);
Vue.use(Select);
Vue.use(Upload);
Vue.use(Tooltip);
Vue.use(Drawer);
Vue.use(Popconfirm);
Vue.use(Badge);
Vue.use(Tree);
Vue.use(Collapse);
Vue.use(Transfer);
Vue.use(ConfigProvider);
Vue.use(Alert);
Vue.prototype.$message = message;
