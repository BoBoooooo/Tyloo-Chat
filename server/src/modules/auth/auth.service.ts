import { FriendMessage } from './../friend/entity/friendMessage.entity';
import { UserMap } from './../friend/entity/friend.entity';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { GroupMap } from '../group/entity/group.entity'; 
import { nameVerify, passwordVerify } from 'src/common/tool/utils';
import { RCode } from 'src/common/constant/rcode';

const defaultPassword = '123456'
const defaultWelcomeMessage = '欢迎使用小冰机器人,有什么能帮您的呢?😃';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupMap)
    private readonly groupUserRepository: Repository<GroupMap>,
    @InjectRepository(UserMap)
    private readonly userMapRepository: Repository<UserMap>,
    @InjectRepository(FriendMessage)
    private readonly friendMessageRepository: Repository<FriendMessage>,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: User): Promise<any> {
    let user ;
    // 如果之前传userId 表示为单点登录,直接登录
    if(data.userId){
      user = await this.userRepository.findOne({userId: data.userId});
      // 如果当前不存在该用户,自动注册,初始密码为 123456
      if(!user){
       const res = this.register({
          ...data,
          password: defaultPassword,
        })
       return res;
      }
    }
    else{
      user = await this.userRepository.findOne({username:data.username, password: data.password});
    }
    if(!user) {
      return {code: 1 , msg:'用户名或密码错误', data: ''};
    }
    const payload = {userId: user.userId, password: user.password};
    return {
      msg:'登录成功',
      data: {
        user: user,
        token: this.jwtService.sign(payload)
      },
    };
  }

  async register(user: User): Promise<any> {
    const isHave = await this.userRepository.find({username: user.username});
    if(isHave.length) {
      return {code: RCode.FAIL, msg:'用户名重复', data: '' };
    }
    if(!passwordVerify(user.password) || !nameVerify(user.username)) {
      return {code: RCode.FAIL, msg:'注册校验不通过！', data: '' };
    }
    user.avatar = `api/avatar/avatar(${Math.round(Math.random()*19 +1)}).png`;
    user.role = 'user';
    user.userId = user.userId
    const newUser = await this.userRepository.save(user);
    const payload = {userId: newUser.userId, password: newUser.password};
    // 默认加入群组
    await this.groupUserRepository.save({
      userId: newUser.userId,
      groupId: '用户问题反馈群',
    });
    // 默认添加小冰机器人为好友
    await this.userMapRepository.save({
      userId: newUser.userId,
      friendId: '小冰机器人'
    });
    // 小冰机器人欢迎语(默认留言)
    await this.friendMessageRepository.save({
      userId: '小冰机器人',
      friendId: newUser.userId,
      content: defaultWelcomeMessage,
      messageType: 'text',
      time: new Date().valueOf()
    })
    return {
      msg:'注册成功',
      data: { 
        user: newUser,
        token: this.jwtService.sign(payload)
      },
    };
  }
}
