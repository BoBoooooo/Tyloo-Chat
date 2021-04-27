<!--
 * @file: webSocket建立流程思路说明
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-12-09 16:28:44
-->
- websocket流程
    - 建立连接
        - 用户默认加入userId房间
        - 默认加入defaultGroup房间
        - 广播给所有其他在线用户,我上线了
    - 初始化聊天数据
        - socket.emit('chatData', user);
        - 获取当前账号所有好友 (friendGather)
        - 获取当前账号已加入的群 (groupGather)
        - 获取群聊记录 (group.messages)
        - 获取私聊记录 (friend.messages)
        - 获取群成员信息 (group.members)
        - 获取跟当前账号有关的所有用户信息(userGather)
            - 包括friendGataher
            - 群聊记录中非好友的用户信息
        - this.server.to(user.userId).emit('chatData',xxx)
    - vuex初始化数据 (handleChatData)
        - 建立私聊房间socket连接 (joinFriendSocket)
        - 建立群聊房间socket连接 (joinGroupSocket)
        - 保存数据
            - commit(SET_GROUP_GATHER, group);
            - commit(SET_FRIEND_GATHER, friend);
            - commit(SET_USER_GATHER, user_);
        - 设置/刷新activeRoom
            - 默认为DEFAULT_GROUP
            - 已有activeRoom则重新赋值activeRoom已便Watch触发监听
    - 断开连接
        - 广播给所有其他在线用户,我下线了
