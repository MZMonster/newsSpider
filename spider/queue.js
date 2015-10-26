/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/24
 * @description
 *
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function QueueEmit() {
}

QueueEmit.EVENT = {
  FETCH: 'fetch',
  FILE: 'file',
  STORE: 'store',
  PARSE: 'parse',
  ERROR: 'error',
  LOG: 'log'
};

util.inherits(QueueEmit, EventEmitter);

/**
 * fetch
 * @param config
 * @param urls
 */
QueueEmit.prototype.download = function (config, urls) {
  this.emit(QueueEmit.EVENT.FETCH, config, urls);
};

/**
 * write file
 * @param config
 * @param url
 * @param stream
 */
QueueEmit.prototype.file = function (config, url, stream) {
  this.emit(QueueEmit.EVENT.FILE, config, url, stream);
};

/**
 * store stream
 * @param config
 * @param url
 * @param stream
 */
QueueEmit.prototype.store = function (config, url, stream) {
  this.emit(QueueEmit.EVENT.STORE, config, url, stream);
};

/**
 * all parse
 * @param config
 * @param url
 * @param stream
 */
QueueEmit.prototype.parse = function (config, url, stream) {
  this.emit(QueueEmit.EVENT.PARSE, config, url, stream);
};

/**
 * all error
 * @param config
 * @param msg
 * @param err
 */
QueueEmit.prototype.error = function (config, msg, err) {
  this.emit(QueueEmit.EVENT.ERROR, config, msg, err);
};

/**
 * all log
 * @param config
 * @param msg
 */
QueueEmit.prototype.log = function (config, msg) {
  this.emit(QueueEmit.EVENT.LOG, config, msg)
};

module.exports = QueueEmit;

