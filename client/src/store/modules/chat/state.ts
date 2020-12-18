export interface ChatState {
  socket: SocketIOClient.Socket;
  dropped: boolean;
  activeRoom: (Group & Friend) | null;
  groupGather: GroupGather;
  userGather: FriendGather;
  friendGather: FriendGather;
  unReadGather: UnReadGather;
}

const chatState: ChatState = {
  // @ts-ignore
  socket: null, // ws实例
  dropped: false, // 是否断开连接
  activeRoom: null, // 当前访问房间
  groupGather: {}, // 群组列表
  userGather: {}, // 设置群在线用户列表
  friendGather: {}, // 好友列表
  unReadGather: {}, // 所有会话未读消息集合
};

export default chatState;
