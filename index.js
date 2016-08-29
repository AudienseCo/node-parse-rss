var FeedParser = require('feedparser');
var request = require('request');

module.exports = function fetch(url, callback) {
  var req = request(url);
  var feedparser = new FeedParser();
  var items = [];
  var errorRaised = false;

  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', _raiseError);
  req.on('response', function(res) {
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    var encoding = res.headers['content-encoding'] || 'identity';
    var charset = getParams(res.headers['content-type'] || '').charset;
    res = maybeDecompress(res, encoding);
    res.pipe(feedparser);
  });

  feedparser.on('error', _raiseError);
  feedparser.on('end', function() { callback(null, items); });
  feedparser.on('readable', function() {
    var post;
    while (post = this.read()) {
      items.push(post);
    }
  });

  function _raiseError(error) {
    if (!errorRaised) callback(error);
    errorRaised = true;
  }
};


function maybeDecompress (res, encoding) {
  var decompress;
  if (encoding.match(/\bdeflate\b/)) {
    decompress = zlib.createInflate();
  } else if (encoding.match(/\bgzip\b/)) {
    decompress = zlib.createGunzip();
  }
  return decompress ? res.pipe(decompress) : res;
}

function getParams(str) {
  var params = str.split(';').reduce(function (params, param) {
    var parts = param.split('=').map(function (part) { return part.trim(); });
    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }
    return params;
  }, {});
  return params;
}

