/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/16
 * @description
 *
 */

var mongoose = require('mongoose');

var NewSchema = {
  id: mongoose.Schema.ObjectId,		// mongodb主键
  link: {type: String, index: true, unique:true},
  title: {type: String, index: true},
  source: {type: String, index: true}
};


module.exports = {
  schema: NewSchema,

  //	Entity Method
  methods: {},

  //	Model Method
  statics: {}
};