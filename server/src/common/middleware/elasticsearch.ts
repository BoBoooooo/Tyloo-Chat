/*
 * @file: elasticsearch中间件模块,需要先安装es,并启动
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-11-19 14:16:37
 */

const axios = require('axios')

const base = 'http://localhost:9200/robot/_doc/_search'

export const getElasticData = (query: string): Promise<any> =>
  axios.get(base, {
    params: {
      source: JSON.stringify({
        query: {
          match: {
            title: query
          }
        }
      }),
      source_content_type: 'application/json'
    }
  })
