/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/26
 * @description
 *
 */

module.exports = {

  // 数据库配置 mongodb/mysql/local
  // 目前仅支持配置 mongodb
  connections: {
    mongodb: {
      host: '127.0.0.1',
      port: 27017,
      database: 'wan',
      options: {
        server: {
          poolSize: 100
        }
      }
    }
  },

  // 网页存储
  file: {
    // 是否存储下载的网页
    store: false,
    // 存放的位置
    dir: './resources/'
  }
};