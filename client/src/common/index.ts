/*
 * @file: 默认群组,需结合后台 (用户新建后默认进入该群组)
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
 */

// 默认群组Id
let bg = '';
if (process.env.VUE_APP_CDN !== 'true' && process.env.NODE_ENV === 'production') {
  // 默认背景图片
  bg = 'http://11.176.37.20:8090/img/secret.jpg';
} else {
  bg = 'https://pic.downk.cc/item/5fc744ea394ac5237897a81d.jpg';
}

export const DEFAULT_GROUP = 'group';

export const DEFAULT_BACKGROUND = bg;
// 默认机器人Id
export const DEFAULT_ROBOT = 'robot';

// 图片/附件请求路径
export const IMAGE_SAVE_PATH = '/static/image/';
export const FILE_SAVE_PATH = '/static/file/';

// MIME类型
export const MIME_TYPE = ['xls', 'xlsx', 'doc', 'docx', 'exe', 'pdf', 'ppt', 'txt', 'zip', 'img', 'rar'];
// 图片类型
export const IMAGE_TYPE = ['png', 'jpg', 'jpeg', 'gif'];
