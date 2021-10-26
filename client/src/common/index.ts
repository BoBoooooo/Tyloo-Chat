/*
 * @file: 默认群组,需结合后台 (用户新建后默认进入该群组)
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年11月05 16:40:11
 */

// 默认群组Id

export const DEFAULT_GROUP = 'group';

// 默认机器人Id
export const DEFAULT_ROBOT = 'robot';

// 图片/附件请求路径
export const FILE_SAVE_PATH = `${process.env.VUE_APP_API_URL}/static/file/`;

// MIME类型
export const MIME_TYPE = ['xls', 'xlsx', 'doc', 'docx', 'exe', 'pdf', 'ppt', 'txt', 'zip', 'img', 'rar'];
// 图片类型
export const IMAGE_TYPE = ['png', 'jpg', 'jpeg', 'gif'];
