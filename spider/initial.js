/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/24
 * @description
 *
 */

/**
 * loading store config
 */
var local = require('../config/store');

var models;
// use mongodb
if (local.connections.mongodb) {
  models = require('./mongo')(local.connections.mongodb);
}

var _ = require('lodash');
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
      // fix file storage path
      if (resourcesDir) {
        config.resourcesDir = resourcesDir + config.name + '/';
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