/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/16
 * @description
 *
 */


var _ = require('lodash');
var fs = require('fs');
var request = require('request');
var Promise = require('bluebird');
var schedule = require('node-schedule');

var queue = require('./spider/queue');
var init = require('./spider/initial');
var fetcher = require('./spider/fetcher');
var parser = require('./spider/parser');

// express
var express = require('express');
var app = express();

/**
 * constants
 * @type {number}
 */
var MILLISECONDS_OF_DAY = 24 * 3600 * 1000;
var MILLISECONDS_OF_MINUTE = 60 * 1000;

/**
 * init all rss New config
 * @type {Array}
 */
var rssConfigs = init.rssConfigs();
/**
 * orm models
 */
var models = init.models;

/**
 * get 00:00:00
 * @returns {Date}
 */
function getTodayBegin() {
  var date = new Date();
  return new Date(date.getTime()
      // 修正UTC时区差 当天归00:00:00
    - (date.getTime() - date.getTimezoneOffset() * MILLISECONDS_OF_MINUTE) % (MILLISECONDS_OF_DAY))
}

/**
 * today cache
 */
var today;

console.log(new Date().toLocaleString(), 'Init all config and parser');

/**
 * a message queue
 * @type {QueueEmit|exports|module.exports}
 */
var queueEmit = new queue();

/**
 * fetch
 */
queueEmit.on(queue.EVENT.FETCH, function (config, urls) {
  // urls begin
  urls.forEach(function (url) {
    fetcher.fetch(url, function (err, stream) {
      if (err) {
        queueEmit.error(config, 'fetch:' + url, err);
        return;
      }
      // 触发write和parse
      queueEmit.file(config, url, stream);
      queueEmit.parse(config, url, stream);
      // log
      queueEmit.log(config, 'fetch:' + url);
    });
  });
});

/**
 * write file
 */
queueEmit.on(queue.EVENT.FILE, function (config, uri, stream) {
  if (config.resourcesDir) {
    var file = fs.createWriteStream(config.resourcesDir + encodeURIComponent(uri) + new Date());
    file.on('error', function (err) {
      queueEmit.error(config, 'file:' + uri, err)
    });
    stream.pipe(file);
    queueEmit.log(config, 'file:' + uri);
  }
});

/**
 * parse stream
 */
queueEmit.on(queue.EVENT.PARSE, function (config, url, stream) {
  parser.parse(stream)
    .then(function (posts) {
      // db
      return Promise.each(posts, function (post) {
        // only today
        if (post.pubDate > today) {
          return Promise.resolve(models['New'].create(_.merge(post, {source: config.source})));
        } else {
          throw new Error('Only parse today rss');
        }
      }).catch(function (err) {
        // rss exist
        if (_.startsWith(err.message, 'E11000 duplicate key error index')) {
          throw new Error('Only parse today rss');
        }
        throw err;
      });
    })
    .then(function () {
      // log
      queueEmit.log(config, 'parse:' + url);
      // next
      if (config.nexts) {
        var nexts = config.nexts();
        queueEmit.fetch(config, nexts);
      }
    })
    .catch(function (err) {
      if (err.message === 'Only parse today rss') {
        // log
        queueEmit.log(config, 'over:' + url);
      } else {
        queueEmit.error(config, 'parse:' + url, err);
      }
    });
});

/**
 * log
 */
queueEmit.on(queue.EVENT.LOG, function (config, msg) {
  Promise.resolve(models['Log'].create({
    time: new Date(),
    type: 'LOG',
    message: msg,
    config: config
  }));
  console.log('LOG', config.source, msg);
});

/**
 * error event
 */
queueEmit.on(queue.EVENT.ERROR, function (config, msg, err) {
  Promise.resolve(models['Log'].create({
    time: new Date(),
    type: 'ERROR',
    message: msg,
    err: err.toString(),
    config: config
  }));
  console.log('ERROR', config.source, msg, err);
});

// index.html
app.get('/', function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
  res.end(fs.readFileSync('./view/index.html'));
});

// rss list
app.get('/rss/list', function (req, res) {

  console.log(req.url);

  var query = {};

  if (req.query.title) {
    query.title = new RegExp(req.query.title, 'gi');
  }

  if (req.query.source) {
    query.source = req.query.source;
  }

  if (req.query.desc) {
    query.description = new RegExp(req.query.desc, 'gi');
  }

  Promise.resolve(models['New'].find(query).sort({pubDate: -1}))
    .then(function (data) {
      res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
      res.end(JSON.stringify(data, null, 4));
    })
    .catch(function (err) {
      console.error(err);
    })
});

// rss statistic
app.get('/rss/statistic', function (req, res) {

  console.log(req.url);

  var query = {'$group': {_id: '$source', count: {'$sum': 1}}};

  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

  models['New'].aggregate(query, function (err, data) {
    if (err) {
      console.error(err);
      return res.end('统计数据出错');
    }
    res.end(getTotals(data));
  });
});

function getTotals(data) {
  return _.reduce(data, function (result, value) {
    if(typeof result === 'string') {
      return result + ', ' + _.values(value).join(': ');
    }
    return _.values(result).join(': ') + ', ' + _.values(value).join(': ')
  });
}

/**
 * schedule to get rss
 */
schedule.scheduleJob(init.config.cron, function () {

  // a cache
  today = getTodayBegin();
  // starts
  rssConfigs.forEach(function (config) {
    if (config.init) {
      config.init();
    }
    queueEmit.fetch(config, config.startUrls);
  });
});

app.listen(init.config.port);

