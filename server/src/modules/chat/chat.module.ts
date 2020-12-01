import { defaultGroup as defaultGroupName } from './../../common/constant/global'
import { DictionaryModule } from './../dictionary/dictionary.module'
import { AuthModule } from './../auth/auth.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatGateway } from './chat.gateway'
import { User } from '../user/entity/user.entity'
import { Group, GroupMap } from '../group/entity/group.entity'
import { GroupMessage } from '../group/entity/groupMessage.entity'
import { UserMap } from '../friend/entity/friend.entity'
import { FriendMessage } from '../friend/entity/friendMessage.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { defaultRobot } from 'src/common/constant/global'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Group,
      GroupMap,
      GroupMessage,
      UserMap,
      FriendMessage
    ]),
    AuthModule,
    DictionaryModule
  ],
  providers: [ChatGateway]
})
export class ChatModule {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
  async onModuleInit() {
    // 默认新增群组 用户问题反馈群
    const defaultGroup = await this.groupRepository.find({
      groupName: defaultGroupName
    })
    if (!defaultGroup.length) {
      await this.groupRepository.save({
        groupId: 'group',
        groupName: defaultGroupName,
        userId: 'robot', // 群主默认为智能助手
        createTime: new Date().valueOf()
      })
      console.log('create default group ' + defaultGroupName)
    }

    // 默认新建机器人
    const defaultRobotArr = await this.userRepository.find({
      username: defaultRobot
    })
    if (!defaultRobotArr.length) {
      await this.userRepository.save({
        userId: 'robot',
        username: defaultRobot,
        avatar: 'api/avatar/robot.png',
        role: 'robot',
        tag: '',
        status: 'on',
        createTime: new Date().valueOf(),
        password: 'robot'
      })
      console.log('create default robot ' + defaultRobot)
    }
  }
}
