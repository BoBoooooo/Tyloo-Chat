/*
 * @file: 全局ws连接异常捕获
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-12-26 13:25:26
 */

import { Catch, ArgumentsHost } from '@nestjs/common'
import { BaseWsExceptionFilter } from '@nestjs/websockets'

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host)
  }
}
