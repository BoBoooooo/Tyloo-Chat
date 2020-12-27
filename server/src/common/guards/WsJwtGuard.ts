/*
 * @file: WS JWT鉴权守卫
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-12-26 11:48:56
 */
import { AuthService } from './../../modules/auth/auth.service'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let client: Socket
    try {
      client = context.switchToWs().getClient<Socket>()
      const authToken: string = client.handshake?.query?.token
      const user = this.authService.verifyUser(authToken)
      return Boolean(user)
    } catch (err) {
      client.emit('unauthorized', '用户信息校验失败,请重新登录!')
      client.disconnect()
      throw new WsException(err.message)
    }
  }
}
