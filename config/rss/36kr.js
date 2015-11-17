/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/23
 * @description
 *
 */

module.exports = {

  /**
   * from source
   */
  source: '36kr',
  /**
   * start urls
   */
  startUrls: ['http://next.36kr.com/feed'],

  nexts: function () {
    if (!this.page) {
      this.page = 2;
    }
    return ['http://next.36kr.com/feed?page=' + this.page++];
  },

  init: function () {
    this.page = 0;
  }
};

