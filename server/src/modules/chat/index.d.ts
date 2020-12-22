// 群组
interface GroupDto {
  groupId: string
  userId: string // 群主id
  groupName: string
  notice: string
  messages?: GroupMessageDto[]
  members?: FriendDto[]
  createTime: number
}

// 群消息
interface GroupMessageDto {
  _id: number
  userId: string
  groupId: string
  content: string
  width?: number
  height?: number
  messageType: string
  time: number
  fileName?: string // 附件名称
  size?: number // 附件大小
}

// 好友
interface FriendDto {
  userId: string
  username: string
  avatar: string
  role?: string
  tag?: string
  messages?: FriendMessageDto[]
  createTime: number
  online?: 1 | 0 // 是否在线
  isManager?: 1 | 0 // 是否为群主
}

// 好友消息
interface FriendMessageDto {
  _id: number
  userId: string
  friendId: string
  content: string
  width?: number
  height?: number
  messageType: string
  time: number
  fileName?: string // 附件名称
  size?: number // 附件大小
}

// 自定义好友DTO
interface UserFriendMap {
  userId: string
  friendId: string
  friendUserName: string
}

// 邀请好友入群DTO
interface FriendsIntoGroup {
  friendIds: string[] // 被邀请人
  groupId: string // 群组ID
  userId: string // 邀请人
}
