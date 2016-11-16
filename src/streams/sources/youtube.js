const stream = require('stream');
const util = require('util');
const env = require('../../config/environment_vars');

function Youtube(image) {
  if (!(this instanceof Youtube)) {
    return new Youtube(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  this.key = 'youtube';

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Youtube, stream.Readable);

Youtube.prototype._read = function read() {
  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  const videoId = this.image.image.split('.')[0];
  const url = `http://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  this.image.log.time(this.key);

  return require('./util/fetch')(this, url);
};

module.exports = Youtube;

// http://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api

// you can also get json data about a Youtube vid like this:
//  - http://gdata.youtube.com/feeds/api/videos/lK1vPu6U2B0?v=2&alt=jsonc
