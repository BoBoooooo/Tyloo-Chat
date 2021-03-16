/*
 * @file: 后台webSocket
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-10-04 18:10:14
 */

import { GroupService } from './../group/group.service'
import {
  defaultGroupId,
  defaultRobotId,
  FILE_SAVE_PATH,
  IMAGE_SAVE_PATH,
  defaultGroupMessageTime
} from './../../common/constant/global'
import { AuthService } from './../auth/auth.service'
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, getRepository } from 'typeorm'
import { Group, GroupMap } from '../group/entity/group.entity'
import { GroupMessage } from '../group/entity/groupMessage.entity'
import { UserMap } from '../friend/entity/friend.entity'
import { FriendMessage } from '../friend/entity/friendMessage.entity'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { RCode } from 'src/common/constant/rcode'
import { formatBytes, nameVerify } from 'src/common/tool/utils'
import { defaultPassword } from 'src/common/constant/global'
import { getElasticData } from 'src/common/middleware/elasticsearch'
import { UseGuards } from '@nestjs/common'
import { User } from './../user/entity/user.entity'
import { WsJwtGuard } from './../../common/guards/WsJwtGuard'
const nodejieba = require('nodejieba')

// const axios = require('axios');
const fs = require('fs')

@WebSocketGateway()
export class ChatGateway {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMap)
    private readonly groupUserRepository: Repository<GroupMap>,
    @InjectRepository(GroupMessage)
    private readonly groupMessageRepository: Repository<GroupMessage>,
    @InjectRepository(UserMap)
    private readonly friendRepository: Repository<UserMap>,
    @InjectRepository(FriendMessage)
    private readonly friendMessageRepository: Repository<FriendMessage>,
    private readonly authService: AuthService,
    private readonly groupService: GroupService
  ) {}

  @WebSocketServer()
  server: Server

  // socket连接钩子
  async handleConnection(client: Socket): Promise<string> {
    const token = client.handshake.query.token
    const user = this.authService.verifyUser(token)
    const { userId } = user
    // 连接默认加入DEFAULG_GROUP
    // TODO 待优化
    client.join(defaultGroupId)
    // 进来统计一下在线人数
    console.log('用户上线', userId)
    // 上线提醒广播给所有人
    client.broadcast.emit('userOnline', {
      code: RCode.OK,
      msg: 'userOnline',
      data: userId
    })

    // 用户独有消息房间 根据userId
    if (userId) {
      client.join(userId)
    }
    return '连接成功'
  }

  // socket断连钩子
  async handleDisconnect(client: Socket): Promise<any> {
    const userId = client.handshake.query.userId
    console.log('用户下线', userId)
    // 下线提醒广播给所有人
    client.broadcast.emit('userOffline', {
      code: RCode.OK,
      msg: 'userOffline',
      data: userId
    })
  }

  // 创建群组
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('addGroup')
  async addGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GroupDto
  ): Promise<any> {
    const isUser = await this.userRepository.findOne({ userId: data.userId })
    if (isUser) {
      const isHaveGroup = await this.groupRepository.findOne({
        groupName: data.groupName
      })
      if (isHaveGroup) {
        this.server.to(data.userId).emit('addGroup', {
          code: RCode.FAIL,
          msg: '该群名字已存在',
          data: isHaveGroup
        })
        return
      }
      if (!nameVerify(data.groupName)) {
        return
      }
      data = await this.groupRepository.save(data)
      client.join(data.groupId)
      const group = await this.groupUserRepository.save(data)
      const member = isUser as FriendDto
      member.online = 1
      member.isManager = 1
      data.members = [member]
      this.server.to(group.groupId).emit('addGroup', {
        code: RCode.OK,
        msg: `成功创建群${data.groupName}`,
        data: group
      })
    } else {
      this.server
        .to(data.userId)
        .emit('addGroup', { code: RCode.FAIL, msg: `你没资格创建群` })
    }
  }

  // 加入群组
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinGroup')
  async joinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GroupMap
  ): Promise<any> {
    const isUser = await this.userRepository.findOne({ userId: data.userId })
    if (isUser) {
      const group = await this.groupRepository.findOne({
        groupId: data.groupId
      })
      let userGroup = await this.groupUserRepository.findOne({
        groupId: group.groupId,
        userId: data.userId
      })
      const user = await this.userRepository.findOne({ userId: data.userId })
      if (group && user) {
        if (!userGroup) {
          data.groupId = group.groupId
          userGroup = await this.groupUserRepository.save(data)
        }
        client.join(group.groupId)
        const res = { group: group, user: user }
        this.server.to(group.groupId).emit('joinGroup', {
          code: RCode.OK,
          msg: `${user.username}加入群${group.groupName}`,
          data: res
        })
      } else {
        this.server
          .to(data.userId)
          .emit('joinGroup', { code: RCode.FAIL, msg: '进群失败', data: '' })
      }
    } else {
      this.server
        .to(data.userId)
        .emit('joinGroup', { code: RCode.FAIL, msg: '你没资格进群' })
    }
  }

  // 加入群组的socket连接
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinGroupSocket')
  async joinGroupSocket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GroupMap
  ): Promise<any> {
    const group = await this.groupRepository.findOne({ groupId: data.groupId })
    const user = await this.userRepository.findOne({ userId: data.userId })
    if (group && user) {
      client.join(group.groupId)
      const res = { group: group, user: user }
      this.server.to(group.groupId).emit('joinGroupSocket', {
        code: RCode.OK,
        msg: `${user.username}加入群${group.groupName}`,
        data: res
      })
    } else {
      this.server.to(data.userId).emit('joinGroupSocket', {
        code: RCode.FAIL,
        msg: '进群失败',
        data: ''
      })
    }
  }

  // 发送群消息
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('groupMessage')
  async sendGroupMessage(@MessageBody() data: GroupMessageDto): Promise<any> {
    const isUser = await this.userRepository.findOne({ userId: data.userId })
    console.log(data)
    if (isUser) {
      const userGroupMap = await this.groupUserRepository.findOne({
        userId: data.userId,
        groupId: data.groupId
      })
      if (!userGroupMap || !data.groupId) {
        this.server.to(data.userId).emit('groupMessage', {
          code: RCode.FAIL,
          msg: '群消息发送错误',
          data: ''
        })
        return
      }
      if (
        data.messageType === 'file' ||
        data.messageType === 'image' ||
        data.messageType === 'video'
      ) {
        // 根据文件类型判断保存路径
        const SAVE_PATH =
          data.messageType === 'image' ? IMAGE_SAVE_PATH : FILE_SAVE_PATH
        const saveName =
          data.messageType === 'image'
            ? `${Date.now()}$${data.userId}$${data.width}$${data.height}`
            : `${Date.now()}$${data.userId}$${formatBytes(data.size)}$${
                data.fileName
              }`
        console.log(data.content)
        const stream = createWriteStream(join(SAVE_PATH, saveName))
        stream.write(data.content)
        data.content = saveName
      }
      console.log(data.groupId)

      data.time = new Date().valueOf() // 使用服务端时间
      await this.groupMessageRepository.save(data)
      this.server.to(data.groupId).emit('groupMessage', {
        code: RCode.OK,
        msg: '',
        data: {
          ...data,
          username: isUser.username // 此处返回发消息人姓名
        }
      })
    } else {
      this.server
        .to(data.userId)
        .emit('groupMessage', { code: RCode.FAIL, msg: '你没资格发消息' })
    }
  }

  // 添加好友
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('addFriend')
  async addFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UserFriendMap
  ): Promise<any> {
    const isUser = await this.userRepository.findOne({ userId: data.userId })
    if (isUser) {
      if (data.friendId && data.userId) {
        if (data.userId === data.friendId) {
          this.server.to(data.userId).emit('addFriend', {
            code: RCode.FAIL,
            msg: '不能添加自己为好友',
            data: ''
          })
          return
        }
        const relation1 = await this.friendRepository.findOne({
          userId: data.userId,
          friendId: data.friendId
        })
        const relation2 = await this.friendRepository.findOne({
          userId: data.friendId,
          friendId: data.userId
        })
        const roomId =
          data.userId > data.friendId
            ? data.userId + data.friendId
            : data.friendId + data.userId

        if (relation1 || relation2) {
          this.server.to(data.userId).emit('addFriend', {
            code: RCode.FAIL,
            msg: '已经有该好友',
            data: data
          })
          return
        }

        let friend = (await this.userRepository.findOne({
          userId: data.friendId
        })) as FriendDto
        const user = (await this.userRepository.findOne({
          userId: data.userId
        })) as FriendDto
        if (!friend) {
          // 此处逻辑定制,如果为选择组织架构添加好友
          // 好友不存在的情况下默认帮好友注册
          if (data.friendUserName) {
            const res = await this.authService.register({
              userId: data.friendId,
              username: data.friendUserName,
              avatar: '',
              role: 'user',
              tag: '',
              status: 'on',
              createTime: new Date().valueOf(),
              password: defaultPassword
            })
            friend = res.data.user
            // 默认添加机器人为好友
            await this.friendRepository.save({
              userId: friend.userId,
              friendId: defaultRobotId
            })
          } else {
            this.server.to(data.userId).emit('addFriend', {
              code: RCode.FAIL,
              msg: '该好友不存在',
              data: ''
            })
            return
          }
        }

        // 双方都添加好友 并存入数据库
        await this.friendRepository.save(data)
        const friendData = JSON.parse(JSON.stringify(data))
        const friendId = friendData.friendId
        friendData.friendId = friendData.userId
        friendData.userId = friendId
        delete friendData._id
        await this.friendRepository.save(friendData)
        client.join(roomId)

        // 如果是删掉的好友重新加, 重新获取一遍私聊消息
        let messages = await getRepository(FriendMessage)
          .createQueryBuilder('friendMessage')
          .orderBy('friendMessage.time', 'DESC')
          .where(
            'friendMessage.userId = :userId AND friendMessage.friendId = :friendId',
            { userId: data.userId, friendId: data.friendId }
          )
          .orWhere(
            'friendMessage.userId = :friendId AND friendMessage.friendId = :userId',
            { userId: data.userId, friendId: data.friendId }
          )
          .take(30)
          .getMany()
        messages = messages.reverse()

        if (messages.length) {
          // @ts-ignore
          friend.messages = messages
          // @ts-ignore
          user.messages = messages
        }
        // @ts-ignore;
        let onlineUserIdArr = Object.values(this.server.engine.clients).map(
          item => {
            // @ts-ignore;
            return item.request._query.userId
          }
        )
        // 所有在线用户userId
        // 数组去重
        onlineUserIdArr = Array.from(new Set(onlineUserIdArr))
        // 好友是否在线
        friend.online = onlineUserIdArr.includes(friend.userId) ? 1 : 0
        this.server.to(data.userId).emit('addFriend', {
          code: RCode.OK,
          msg: `添加好友${friend.username}成功`,
          data: friend
        })
        // 发起添加的人默认在线
        user.online = 1
        this.server.to(data.friendId).emit('addFriend', {
          code: RCode.OK,
          msg: `${user.username}添加你为好友`,
          data: user
        })
      }
    } else {
      this.server
        .to(data.userId)
        .emit('addFriend', { code: RCode.FAIL, msg: '你没资格加好友' })
    }
  }

  // 加入私聊的socket连接
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinFriendSocket')
  async joinFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UserMap
  ): Promise<any> {
    if (data.friendId && data.userId) {
      const relation = await this.friendRepository.findOne({
        userId: data.userId,
        friendId: data.friendId
      })
      const roomId =
        data.userId > data.friendId
          ? data.userId + data.friendId
          : data.friendId + data.userId
      if (relation) {
        client.join(roomId)
        this.server.to(data.userId).emit('joinFriendSocket', {
          code: RCode.OK,
          msg: '进入私聊socket成功',
          data: relation
        })
      }
    }
  }

  // 发送私聊消息
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('friendMessage')
  async friendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: FriendMessageDto
  ): Promise<any> {
    const isUser = await this.userRepository.findOne({ userId: data.userId })
    if (isUser) {
      if (data.userId && data.friendId) {
        const roomId =
          data.userId > data.friendId
            ? data.userId + data.friendId
            : data.friendId + data.userId
        // 根据文件类型判断保存路径
        if (
          data.messageType === 'file' ||
          data.messageType === 'image' ||
          data.messageType === 'video'
        ) {
          const SAVE_PATH =
            data.messageType === 'image' ? IMAGE_SAVE_PATH : FILE_SAVE_PATH
          const saveName =
            data.messageType === 'image'
              ? `${Date.now()}$${data.userId}$${data.width}$${data.height}`
              : `${Date.now()}$${data.userId}$${formatBytes(data.size)}$${
                  data.fileName
                }`
          console.log(data.content)
          const stream = createWriteStream(join(SAVE_PATH, saveName))
          stream.write(data.content)
          data.content = saveName
          console.log(roomId)
          console.log(data.friendId)
        }

        data.time = new Date().valueOf()
        await this.friendMessageRepository.save(data)
        this.server
          .to(roomId)
          .emit('friendMessage', { code: RCode.OK, msg: '', data })
        // 如果friendID 为机器人,则需要自动回复
        // 获取自动回复内容
        if (data.friendId === defaultRobotId) {
          this.autoReply(data, roomId)
        }
      }
    } else {
      this.server.to(data.userId).emit('friendMessage', {
        code: RCode.FAIL,
        msg: '你没资格发消息',
        data
      })
    }
  }

  // 通过输入内容模糊匹配自动回复词条
  async getReplyMessage(content: string) {
    const failMessage = '智能助手不知道你在说什么。'
    try {
      // 此处引用分词器进行中文分词
      // nodejieba
      // https://github.com/yanyiwu/nodejieba
      const splitWords = nodejieba.cut(content).join(' ')
      console.log(splitWords)
      const res = await getElasticData(splitWords)
      console.log(res.data)
      const result = res.data.hits.hits
      if (result.length > 0) {
        return result[0]._source.title
      }
      return failMessage
    } catch (e) {
      return failMessage
    }
  }
  // 机器人自动回复
  async autoReply(data, roomId) {
    // 获取自动回复内容
    const message = await this.getReplyMessage(data.content)

    const reply = {
      time: new Date().valueOf(),
      content: message,
      userId: defaultRobotId,
      friendId: data.userId,
      messageType: 'text'
    }
    // 保存至好友消息表
    await this.friendMessageRepository.save(reply)
    this.server
      .to(roomId)
      .emit('friendMessage', { code: RCode.OK, msg: '', data: reply })
  }

  // 获取所有群和好友数据
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chatData')
  async getAllData(@MessageBody() token: string): Promise<any> {
    const user = this.authService.verifyUser(token)
    if (user) {
      const isUser = await this.userRepository.findOne({
        userId: user.userId
      })
      let groupArr: GroupDto[] = []
      let friendArr: FriendDto[] = []
      const userGather: { [key: string]: User } = {}
      let userArr: FriendDto[] = []
      // @ts-ignore;
      let onlineUserIdArr = Object.values(this.server.engine.clients).map(
        item => {
          // @ts-ignore;
          return item.request._query.userId
        }
      )
      // 所有在线用户userId
      // 数组去重
      onlineUserIdArr = Array.from(new Set(onlineUserIdArr))

      // 找到用户所属的群
      const groups: GroupDto[] = await getRepository(Group)
        .createQueryBuilder('group')
        .innerJoin(
          'group_map',
          'group_map',
          'group_map.groupId = group.groupId'
        )
        .select('group.groupName', 'groupName')
        .addSelect('group.groupId', 'groupId')
        .addSelect('group.notice', 'notice')
        .addSelect('group.userId', 'userId')
        .addSelect('group_map.createTime', 'createTime') // 获取用户进群时间
        .where('group_map.userId = :id', { id: isUser.userId })
        .getRawMany()
      // 找到用户所有好友
      const friends: FriendDto[] = await getRepository(User)
        .createQueryBuilder('user')
        .select('user.userId', 'userId')
        .addSelect('user.username', 'username')
        .addSelect('user.avatar', 'avatar')
        .addSelect('user.role', 'role')
        .where((qb: any) => {
          const subQuery = qb
            .subQuery()
            .select('s.userId')
            .innerJoin('user_map', 'p', 'p.friendId = s.userId')
            .from(`user`, 's')
            .where('p.userId = :userId', { userId: isUser.userId })
            .getQuery()
          // tslint:disable-next-line:prefer-template
          return 'user.userId IN ' + subQuery
        })
        .getRawMany()
      // 获取所有群聊消息
      const groupMessagePromise = groups.map(async item => {
        const createTime = item.createTime // 用户进群时间
        const groupMessage = await getRepository(GroupMessage)
          .createQueryBuilder('group_message')
          .innerJoin('user', 'user', 'user.userId = group_message.userId')
          .select('group_message.*')
          .addSelect('user.username', 'username')
          .orderBy('group_message.time', 'DESC')
          .where('group_message.groupId = :id', { id: item.groupId })
          .andWhere('group_message.time >= :createTime', {
            createTime: createTime - defaultGroupMessageTime // 新用户进群默认可以看群近24小时消息
          })
          .limit(10)
          .getRawMany()
        groupMessage.reverse()
        // 这里获取一下发消息的用户的用户信息
        for (const message of groupMessage) {
          if (!userGather[message.userId]) {
            userGather[message.userId] = await this.userRepository.findOne({
              userId: message.userId
            })
          }
        }
        return groupMessage
      })

      // 好友消息
      const friendMessagePromise = friends.map(async item => {
        const messages = await getRepository(FriendMessage)
          .createQueryBuilder('friendMessage')
          .orderBy('friendMessage.time', 'DESC')
          .where(
            'friendMessage.userId = :userId AND friendMessage.friendId = :friendId',
            { userId: user.userId, friendId: item.userId }
          )
          .orWhere(
            'friendMessage.userId = :friendId AND friendMessage.friendId = :userId',
            { userId: user.userId, friendId: item.userId }
          )
          .take(10)
          .getMany()
        return messages.reverse()
      })

      const groupsMessage: Array<GroupMessageDto[]> = await Promise.all(
        groupMessagePromise
      )

      await Promise.all(
        groups.map(async (group, index) => {
          if (groupsMessage[index] && groupsMessage[index].length) {
            group.messages = groupsMessage[index]
          }
          group.members = []
          // 获取群成员信息
          const groupUserArr = await this.groupUserRepository.find({
            groupId: group.groupId
          })
          if (groupUserArr.length) {
            for (const u of groupUserArr) {
              const _user: FriendDto = await this.userRepository.findOne({
                userId: u.userId
              })
              if (_user) {
                // 设置群成员是否在线
                onlineUserIdArr.includes(_user.userId)
                  ? ((_user as FriendDto).online = 1)
                  : ((_user as FriendDto).online = 0)
                // 检查是否为群主
                _user.isManager = _user.userId === group.userId ? 1 : 0
                group.members.push(_user)
              }
            }
          }
          return Promise.resolve(group)
        })
      )

      groupArr = groups
      const friendsMessage: Array<FriendMessageDto[]> = await Promise.all(
        friendMessagePromise
      )

      friends.map((friend, index) => {
        if (friendsMessage[index] && friendsMessage[index].length) {
          friend.messages = friendsMessage[index]
        }
        // 设置好友在线状态
        friend.online = onlineUserIdArr.includes(friend.userId) ? 1 : 0
      })
      friendArr = friends
      userArr = [...Object.values(userGather), ...friendArr]
      this.server.to(user.userId).emit('chatData', {
        code: RCode.OK,
        msg: '获取聊天数据成功',
        data: {
          groupData: groupArr,
          friendData: friendArr,
          userData: userArr
        }
      })
    }
  }

  // 退群
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('exitGroup')
  async exitGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() groupMap: GroupMap
  ): Promise<any> {
    if (groupMap.groupId === defaultGroupId) {
      return this.server
        .to(groupMap.userId)
        .emit('exitGroup', { code: RCode.FAIL, msg: '默认群不可退' })
    }
    const user = await this.userRepository.findOne({ userId: groupMap.userId })
    const group = await this.groupRepository.findOne({
      groupId: groupMap.groupId
    })
    const map = await this.groupUserRepository.findOne({
      userId: groupMap.userId,
      groupId: groupMap.groupId
    })
    if (user && group && map) {
      await this.groupUserRepository.remove(map)
      return this.server
        .to(groupMap.groupId)
        .emit('exitGroup', { code: RCode.OK, msg: '退群成功', data: groupMap })
    }
    this.server
      .to(groupMap.userId)
      .emit('exitGroup', { code: RCode.FAIL, msg: '退群失败' })
  }

  // 删好友
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('exitFriend')
  async exitFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody() userMap: UserMap
  ): Promise<any> {
    const user = await this.userRepository.findOne({ userId: userMap.userId })
    const friend = await this.userRepository.findOne({
      userId: userMap.friendId
    })
    const map1 = await this.friendRepository.findOne({
      userId: userMap.userId,
      friendId: userMap.friendId
    })
    const map2 = await this.friendRepository.findOne({
      userId: userMap.friendId,
      friendId: userMap.userId
    })
    if (user && friend && map1 && map2) {
      await this.friendRepository.remove(map1)
      await this.friendRepository.remove(map2)
      return this.server.to(userMap.userId).emit('exitFriend', {
        code: RCode.OK,
        msg: '删好友成功',
        data: userMap
      })
    }
    this.server
      .to(userMap.userId)
      .emit('exitFriend', { code: RCode.FAIL, msg: '删好友失败' })
  }

  // 消息撤回
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('revokeMessage')
  async revokeMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageDto: GroupMessageDto & FriendMessageDto
  ): Promise<any> {
    // 先判断groupId是否有值,有值的话撤回的是群聊消息
    if (messageDto.groupId) {
      const groupMessage = await this.groupMessageRepository.findOne(
        messageDto._id
      )
      await this.groupMessageRepository.remove(groupMessage)
      return this.server.to(messageDto.groupId).emit('revokeMessage', {
        code: RCode.OK,
        msg: '已撤回了一条消息',
        data: messageDto
      })
    } else {
      const friendMessage = await this.friendMessageRepository.findOne(
        messageDto._id
      )
      const roomId =
        messageDto.userId > messageDto.friendId
          ? messageDto.userId + messageDto.friendId
          : messageDto.friendId + messageDto.userId
      console.log('消息撤回---' + messageDto._id)
      await this.friendMessageRepository.remove(friendMessage)
      return this.server.to(roomId).emit('revokeMessage', {
        code: RCode.OK,
        msg: '已撤回了一条消息',
        data: messageDto
      })
    }
  }

  // 更新群信息(公告,群名)
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('updateGroupInfo')
  async updateGroupNotice(@MessageBody() data: GroupDto): Promise<any> {
    console.log(data)
    const group = await this.groupRepository.findOne(data.groupId)
    group.groupName = data.groupName
    group.notice = data.notice
    const res = await this.groupService.update(group)
    this.server.to(data.groupId).emit('updateGroupInfo', res)
    return
  }

  // 更新用户信息(头像\用户名)
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('updateUserInfo')
  async updateUserInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      userId
    })
    // 广播给所有用户我的信息更新了
    client.broadcast.emit('updateUserInfo', {
      code: RCode.OK,
      msg: 'userOnline',
      data: user
    })
  }
  // 邀请好友入群
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('inviteFriendsIntoGroup')
  async inviteFriendsIntoGroup(
    @MessageBody() data: FriendsIntoGroup
  ): Promise<any> {
    try {
      // 获取所有邀请好友
      const isUser = await this.userRepository.findOne({ userId: data.userId })
      const group = await this.groupRepository.findOne({
        groupId: data.groupId
      })
      const res = {
        group: group,
        friendIds: data.friendIds,
        userId: data.userId,
        invited: true // 标记为,此处跟单人加群区分
      }
      if (isUser) {
        for (const friendId of data.friendIds) {
          if (group) {
            data.groupId = group.groupId
            await this.groupUserRepository.save({
              groupId: data.groupId,
              userId: friendId
            })
            // 广播所有被邀请者 (此处暂不判断该好友是否在线,统一广播,后期可优化)
            this.server.to(friendId).emit('joinGroup', {
              code: RCode.OK,
              msg: isUser.username + '邀请您加入群聊' + group.groupName,
              data: res
            })
          }
        }
        console.log('inviteFriendsIntoGroup', res)
        this.server.to(group.groupId).emit('joinGroup', {
          code: RCode.OK,
          msg: '邀请' + data.friendIds.length + '位好友加入群聊',
          data: res
        })
      }
    } catch (error) {
      this.server.to(data.userId).emit('joinGroup', {
        code: RCode.FAIL,
        msg: '邀请失败:' + error,
        data: null
      })
    }
  }
}
