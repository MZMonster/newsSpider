/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/24
 * @description
 *
 */

/**
 * loading config
 */
var _ = require('lodash');
var storage = require('../config/storage');
var schedule = require('../config/schedule');
var expressConfig = require('../config/express');
var local;
try {
  local = require('../config/local')
} catch (e) {
  local = {};
}

var models;

local = _.merge({}, storage, schedule, expressConfig, local);

// use mongodb
if (local.connections.mongodb) {
  models = require('./mongo')(local.connections.mongodb);
}

var fs = require('fs');

/**
 * 补全右边的斜杠
 * @param dirPath
 */
function fixSlash(dirPath) {
  if (!_.endsWith(dirPath, '/')) {
    dirPath += '/';
  }
  if (!_.startsWith(dirPath, '/')) {
    dirPath = '/' + dirPath;
  }
  return dirPath;
}

/**
 * loading all rss config
 * @returns {Array}
 */
function loadRssConfigs() {

  var rssConfigsDir = process.cwd() + '/config/rss/';
  var resourcesDir;
  if (local.file.store) {
    resourcesDir = process.cwd() + fixSlash(local.file.dir);
  }

  var confFiles = fs.readdirSync(rssConfigsDir);
  var configs = [];
  for (var i in confFiles) {
    if (fs.statSync(rssConfigsDir + confFiles[i]).isFile()) {
      var config = require(rssConfigsDir + confFiles[i]);
      // set source
      var name = confFiles[i].replace(/\.js$/i, '');
      if (!config.source) {
        config.source = name;
      }
      // fix file storage path
      if (resourcesDir) {
        if (!fs.existsSync(resourcesDir)) {
          fs.mkdirSync(resourcesDir);
        }
        config.resourcesDir = resourcesDir + config.source + '/';
        if (!fs.existsSync(config.resourcesDir)) {
          fs.mkdirSync(config.resourcesDir);
        }
      }
      configs.push(config);
    }
  }
  return configs;
}

module.exports = {
  rssConfigs: loadRssConfigs,
  config: local,
  models: models
};