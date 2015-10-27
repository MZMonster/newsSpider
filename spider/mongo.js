/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/16
 * @description
 *
 */

var mongo = require('mongoose');

function initMongo(config) {

  var uri = 'mongodb://' + config.host + ':' + config.port + '/' + config.database;

  console.info(new Date().toLocaleString(), 'Connect to ' + uri);

  var connection = mongo.connect(uri, config.options).connection;
  connection.on('error', function (err) {
    console.error(new Date().toLocaleString(), 'MongoDB connection error', err);
  });
  connection.on('open', function callback() {
    console.info(new Date().toLocaleString(), 'Connected to MongoDB');
  });

  // set to mongoose
  var mongoose = {};
  // init mongoose models
  var fs = require('fs');
  var schemaFolder = process.cwd() + '/model/';
  var schemaFile = fs.readdirSync(schemaFolder);
  for (var i in schemaFile) {
    var name = schemaFile[i].replace(/\.js$/i, '');
    var modelSchema = require(schemaFolder + schemaFile[i]);
    _addModel(name, modelSchema);
  }

  /**
   * add new mongoose model on sails.mongoose
   * @param name
   * @param modelSchema
   * @private
   */
  function _addModel(name, modelSchema) {
    var schema = new mongo.Schema(modelSchema.schema, {strict: false});
    schema.methods = modelSchema.methods || {};
    schema.statics = modelSchema.statics || {};

    mongoose[name] = mongo.model(name, schema, name);  // bind on sails.mongoose
  }

  return mongoose;
}

module.exports = initMongo;
