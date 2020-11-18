import { DictionaryModule } from './../dictionary/dictionary.module';
import { AuthModule } from './../auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { User } from '../user/entity/user.entity';
import { Group, GroupMap } from '../group/entity/group.entity';
import { GroupMessage } from '../group/entity/groupMessage.entity';
import { UserMap } from '../friend/entity/friend.entity';
import { FriendMessage } from '../friend/entity/friendMessage.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, GroupMap, GroupMessage, UserMap, FriendMessage]),
    AuthModule,
    DictionaryModule
  ],
  providers: [ChatGateway],
})
export class ChatModule {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async onModuleInit() {
    // 默认新增群组 用户问题反馈群
    const defaultGroup = await this.groupRepository.find({groupName: '用户问题反馈群'});
    if(!defaultGroup.length) {
      await this.groupRepository.save({
        groupId: '用户问题反馈群',
        groupName: '用户问题反馈群',
        userId: 'admin',
        createTime: new Date().valueOf()
      });
      console.log('create default group 用户问题反馈群');
    }

    // 默认新建机器人
    const defaultRobot = await this.userRepository.find({username: '小冰机器人'});
    if(!defaultRobot.length) {
      await this.userRepository.save({
        userId: '小冰机器人',
        username: '小冰机器人',
        avatar: 'api/avatar/robot(0).png',
        role: 'robot',
        tag: '',
        status: 'on',
        createTime: new Date().valueOf() ,
        password: 'robot',
      });
      console.log('create default robot 小冰机器人');
    }
  }
}
