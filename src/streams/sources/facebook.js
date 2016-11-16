const stream = require('stream');
const util = require('util');
const env = require('../../config/environment_vars');

function Facebook(image) {
  if (!(this instanceof Facebook)) {
    return new Facebook(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  this.key = 'facebook';

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Facebook, stream.Readable);

Facebook.prototype._read = function read() {
  const _this = this;

  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  const fbUid = this.image.image.split('.').slice(0, -1).join('.');
  const url = `https://graph.facebook.com/${fbUid}/picture?type=large`;

  this.image.log.time(this.key);
  return require('./util/fetch')(_this, url);
};

module.exports = Facebook;
