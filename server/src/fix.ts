/*
 * @file: 修改socket.io serveClient,避免ncc打包后启动报错
 * https://stackoverflow.com/questions/51914186/cannot-find-module-socket-io-client-dist-socket-io-js-when-starting-express-ap
 * @author: BoBo
 * @copyright: BoBo
 * @Date: 2020-11-30 16:04:32
 */

const fs = require('fs')
const path = require('path')

module.exports = async () => {
  // 如果已经拉取过依赖包
  const socket_io_path = `${path.resolve(
    __dirname,
    '..'
  )}/node_modules/socket.io/lib/index.js`
  // 破解gojs
  if (fs.existsSync(socket_io_path)) {
    fs.readFile(socket_io_path, 'utf8', (err1, files) => {
      const result = files.replace(
        'this.serveClient(false !== opts.serveClient);',
        '// this.serveClient(false !== opts.serveClient);'
      )
      fs.writeFile(socket_io_path, result, 'utf8', err2 => console.log(err2))
    })
    Promise.resolve()
  }
}
