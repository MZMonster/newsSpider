/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/11/13
 * @description
 *
 */

var mongoose = require('mongoose');

var LogSchema = {
  id: mongoose.Schema.ObjectId,		// mongodb主键
  time: {type: Date, defaultsTO: new Date(), index: true}
};


module.exports = {
  schema: LogSchema,

  //	Entity Method
  methods: {},

  //	Model Method
  statics: {}
};