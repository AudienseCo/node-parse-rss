var FeedParser = require('feedparser');
var axios = require('axios');



module.exports = function fetch(url, callback) {
  
  
  const feedparser = new FeedParser();
  axios.get(url, {
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    }
  }).then(response => {
    if (response.status !== 200) {
      throw new Error('Bad status code');
    }

    const items = [];
    let errorRaised = false;
    var encoding = response.headers['Content-Encoding'] || 'identity';
    const responseData = response.data
    const responseDecompress = maybeDecompress(responseData, encoding)
    const responseParsed = responseDecompress.pipe(feedparser)
    
    responseParsed.on('error', _raiseError);

    responseParsed.on('end', function() {
      if (!errorRaised) callback(null, items);
    });
    responseParsed.on('data', function(chunck) {
        items.push(chunck);
    });

    function _raiseError(error) {
      if (!errorRaised) {
        errorRaised = true;
        callback(error);
      }
    }
  }).catch(error => {
    callback(error);
  });
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