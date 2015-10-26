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

var queue = require('./spider/queue');
var init = require('./spider/initial');
var fetcher = require('./spider/fetcher');
var parser = require('./spider/parser');

/**
 * init all rss news config
 * @type {Array}
 */
var rssConfigs = init.rssConfigs();
/**
 * orm models
 */
var models = init.models;

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
  // 从startUrl开始
  urls.forEach(function (url) {
    fetcher.fetch(url)
      .then(function (stream) {
        // 触发write和parse
        queueEmit.file(config, url, stream);
        queueEmit.parse(config, url, stream);
        // log
        queueEmit.log(config, 'download:' + url);
        return '';
      })
      .catch(function (err) {
        queueEmit.error(config, 'download:' + url, err);
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
      queueEmit.error(config, 'write:' + uri, err)
    });
    stream.pipe(file);
    queueEmit.log(config, 'write:' + uri)
  }
});

/**
 * parse stream
 */
queueEmit.on(queue.EVENT.PARSE, function (config, url, stream) {
  parser.parse(stream)
    .then(function (posts) {
      console.log(posts);
      // log
      queueEmit.log(config, 'parse:' + url);
      return '';
    })
    .catch(function (err) {
      queueEmit.error(config, 'parse:' + url, err);
    });
});

/**
 * log
 */
queueEmit.on(queue.EVENT.LOG, function (config, msg) {
  console.log('LOG', config.name, msg);
});

/**
 * error event
 */
queueEmit.on(queue.EVENT.ERROR, function (config, msg, err) {
  console.log('ERROR', config.name, msg, err);
});

// starts
rssConfigs.forEach(function (config) {
  queueEmit.emit(queue.EVENT.FETCH, config, config.startUrls);
});

