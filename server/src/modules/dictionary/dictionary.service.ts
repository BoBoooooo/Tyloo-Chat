import { Injectable } from '@nestjs/common'
import { Like, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Dictionary } from './entity/dictionary.entity'
import { RCode } from 'src/common/constant/rcode'
import { getElasticData } from 'src/common/middleware/elasticsearch'

const nodejieba = require('nodejieba')

@Injectable()
export class DictionaryService {
  constructor(
    @InjectRepository(Dictionary)
    private readonly dictionaryRepository: Repository<Dictionary>
  ) {}

  async addMessage(dictionary: Dictionary) {
    try {
      const newDict = await this.dictionaryRepository.insert(dictionary)
      return { msg: '新增词条成功', data: newDict }
    } catch (e) {
      return { code: RCode.ERROR, msg: '新增词条失败', data: e }
    }
  }

  /**
   * 获取词条信息
   * @param id
   */
  async getMessage(id: string) {
    try {
      let data
      if (id) {
        data = await this.dictionaryRepository.findOne({
          where: { _id: id }
        })
        return { msg: '读取词条成功', data }
      }
    } catch (e) {
      return { code: RCode.ERROR, msg: '读取词条失败', data: e }
    }
  }

  async postMessage() {
    try {
      const data = await this.dictionaryRepository.find()
      return { msg: '获取词条成功', data }
    } catch (e) {
      return { code: RCode.ERROR, msg: '获取词条失败', data: e }
    }
  }

  async updateMessage(dictionary: Dictionary) {
    try {
      const dict = await this.dictionaryRepository.findOne({
        _id: dictionary._id
      })
      if (dict) {
        const newDict = await this.dictionaryRepository.update(dict, dictionary)
        return { msg: '更新词条成功', data: newDict }
      }
      return { code: RCode.FAIL, msg: '更新词条失败', data: '' }
    } catch (e) {
      return { code: RCode.ERROR, msg: '更新词条失败', data: e }
    }
  }

  async delMessage(id: number) {
    try {
      const dict = await this.dictionaryRepository.findOne({ _id: id })
      if (dict) {
        await this.dictionaryRepository.delete({ _id: id })
        return { msg: '删除词条成功' }
      }
      return { code: RCode.FAIL, msg: '删除词条失败' }
    } catch (e) {
      return { code: RCode.ERROR, msg: '删除词条失败', data: e }
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
}
