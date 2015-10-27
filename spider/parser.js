/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author zhangxun
 * @date  15/10/26
 * @description
 *
 */
var _ = require('lodash');
var Promise = require('bluebird');
var FeedParser = require('feedparser');

var postOptions = ['title', 'description', 'summary', 'date', 'pubDate', 'link', 'guid', 'author', 'comments', 'origlink', 'image', 'source', 'categories', 'enclosures'];
//var siteInfoOption = ['title', 'description', 'date', 'link', 'xmlurl', 'author', 'favicon', 'copyright', 'generator', 'image'];

function parse(stream, options) {

  options = options || postOptions;

  return new Promise(function (resolve, reject) {

    var posts = [], post;
    var feedparser = new FeedParser();

    stream.pipe(feedparser);

    feedparser.on('error', reject);
    feedparser.on('end', function (err) {
      if (err) {
        return reject(err);
      }
      resolve(posts);
    });
    feedparser.on('readable', function () {
      while (post = this.read()) {
        var post = _.pick(post, options);

        posts.push(post);
      }
    });
  });
}


module.exports = {
  parse: parse
};
