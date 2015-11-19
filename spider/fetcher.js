/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/16
 * @description
 *
 */
var fs = require('fs');
var es = require('event-stream');
var request = require('request');
var Promise = require('bluebird');
var iconv = require('iconv-lite');
var stream = require('stream');

var headers = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11) AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56"
};

/**
 * 封装成Promise, stream
 * @param url
 * @param cb {Function}
 * @returns {bluebird|exports|module.exports}
 */
function fetch(url, cb) {
    // Define our streams
    var req = request(url, {timeout: 60000, pool: false});
    req.setMaxListeners(50);
    // Some feeds do not respond without user-agent and accept headers.
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11) AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56');
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    // Define our handlers
    req.on('error', cb);
    req.on('response', function (res) {
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

      var body = [], total_len = 0;

      res.on('data', function (chunk) {
        if (chunk) {
          body.push(chunk);
          total_len += chunk.length;
        }
      });

      res.on('end', function () {

        var rs = new stream.PassThrough();
        body = Buffer.concat(body, total_len);
        rs.end(body);

        var encoding = res.headers['content-encoding'] || 'identity'
          , charset  = getParams(res.headers['content-type'] || '').charset;
        rs = maybeDecompress(rs, encoding);
        rs = maybeTranslate(rs, charset);

        cb(null, rs);
      });

    });
}

function maybeDecompress(res, encoding) {
  var decompress;
  if (encoding.match(/\bdeflate\b/)) {
    decompress = zlib.createInflate();
  } else if (encoding.match(/\bgzip\b/)) {
    decompress = zlib.createGunzip();
  }
  return decompress ? res.pipe(decompress) : res;
}

function maybeTranslate(res, charset) {

  if (!charset) {
    res = res.pipe(es.through(function (data) {

      //get charset from <?xml version="1.0" encoding="gb2312"?><rss version="2.0">
      //then convert gb2312,gbk,big5 etc to utf-8

      var result = data.toString('utf-8');

      var meta = result.match(/<\?(.*?)\?>/g);
      if (meta !== null) {
        meta = meta[0].toString().match(/encoding="(.*?)"\?>/g);
        charset = meta.toString().split('"')[1];
      }

      //iconv-lite , which can support windows
      result = iconv.decode(data, charset);
      this.emit('data', result);
    }));
  } else {
    // Use iconv if its not utf8 already.
    try {
      console.log('Converting from charset %s to utf-8', charset);
      // If we're using iconv, stream will be the output of iconv
      // otherwise it will remain the output of request
      res = res.pipe(iconv.decodeStream(charset));
    } catch (err) {
      res.emit('error', err);
    }
  }
  return res;
}

function getParams(str) {
  var params = str.split(';').reduce(function (params, param) {
    var parts = param.split('=').map(function (part) {
      return part.trim();
    });
    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }
    return params;
  }, {});
  return params;
}


module.exports = {
  fetch: fetch
};
