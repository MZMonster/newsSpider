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
 * init all rss news config
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
    fetcher.fetch(url)
      .then(function (stream) {
        // 触发write和parse
        queueEmit.file(config, url, stream);
        queueEmit.parse(config, url, stream);
        // log
        queueEmit.log(config, 'fetch:' + url);
      })
      .catch(function (err) {
        queueEmit.error(config, 'fetch:' + url, err);
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
    queueEmit.log(config, 'file:' + uri)
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
          return Promise.resolve(models['News'].create(_.merge(post, {source: config.source})));
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
  console.log('LOG', config.source, msg);
});

/**
 * error event
 */
queueEmit.on(queue.EVENT.ERROR, function (config, msg, err) {
  console.log('ERROR', config.source, msg, err);
});

// index.html
app.get('/', function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
  res.end(fs.readFileSync('./view/index.html'));
});

// rss list
app.get('/rss/list', function (req, res) {

  var query = {};

  if (req.query.source) {
    query = {source: req.query.source}
  }

  Promise.resolve(models['News'].find(query).sort({pubDate: -1}))
    .then(function (data) {
      res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
      res.end(JSON.stringify(data, null, 4));
    })
    .catch(function (err) {
      console.error(err);
    })
});

/**
 * schedule to get rss
 */
schedule.scheduleJob(init.config.cron, function () {
  // a cache
  today = getTodayBegin();
  // starts
  rssConfigs.forEach(function (config) {
    queueEmit.fetch(config, config.startUrls);
  });
});

app.listen(init.config.port);

