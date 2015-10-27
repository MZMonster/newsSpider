/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/27
 * @description
 *
 */

var schedule = require('node-schedule');

schedule.scheduleJob('0 0 */1 * * *', function(){
  console.log(new Date());
});