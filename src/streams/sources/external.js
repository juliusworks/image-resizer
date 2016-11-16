// Fetches an image from an external URL

const stream = require('stream');
const util = require('util');
const request = require('request');

function contentLength(bufs) {
  return bufs.reduce((sum, buf) => sum + buf.length, 0);
}

function External(image, key, prefix) {
  if (!(this instanceof External)) {
    return new External(image, key, prefix);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  this.key = key;
  this.prefix = prefix;
}

util.inherits(External, stream.Readable);

External.prototype._read = function read() {
  const _this = this;
  const bufs = [];

  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  const url = `${this.prefix}/${this.image.path}`;

  this.image.log.time(this.key);

  const imgStream = request.get(url);

  imgStream.on('data', d => bufs.push(d));

  imgStream.on('error', (err) => {
    _this.image.error = new Error(err);
  });

  imgStream.on('response', (response) => {
    if (response.statusCode !== 200) {
      _this.image.error = new Error(`Error ${response.statusCode}:`);
    }
  });

  imgStream.on('end', () => {
    _this.image.log.timeEnd(_this.key);
    if (_this.image.isError()) {
      _this.image.error.message += Buffer.concat(bufs);
    } else {
      _this.image.contents = Buffer.concat(bufs);
      _this.image.originalContentLength = contentLength(bufs);
    }
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });

  return null;
};

module.exports = External;
