/*
 * @file: 机器人自动回复词条表
 * @author: BoBo
 * @copyright: NanJing Anshare Tech .Com
 * @Date: 2020-11-18 13:54:31
 */

import { DictionaryService } from './dictionary.service';
import { Controller, Post, Get, 
  Body, Query, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('dictionary')
@UseGuards(AuthGuard('jwt'))
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get()
  getMessage(@Query('id') id: string) {
    return this.dictionaryService.getMessage(id);
  }

  @Post()
  addMessage(@Body() dict) {
    return this.dictionaryService.addMessage(dict);
  }

  @Post()
  postMessage() {
    return this.dictionaryService.postMessage();
  }

  @Patch('username')
  updateMessage(@Body() dict) {
    return this.dictionaryService.updateMessage(dict);
  }

  @Delete()
  delMessage(@Query() { id }) {
    return this.dictionaryService.delMessage(id);
  }

}
