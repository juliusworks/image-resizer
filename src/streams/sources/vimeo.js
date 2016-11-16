const stream = require('stream');
const util = require('util');
const request = require('request');
const env = require('../../config/environment_vars');

function Vimeo(image) {
  if (!(this instanceof Vimeo)) {
    return new Vimeo(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  this.key = 'vimeo';

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Vimeo, stream.Readable);

Vimeo.prototype._read = function read() {
  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  const endStream = () => {
    this.ended = true;
    this.push(this.image);
    this.push(null);
  };

  this.image.log.time(this.key);
  const videoId = this.image.image.split('.')[0];
  const url = `http://vimeo.com/api/v2/video/${videoId}.json`;

  return request(url, (err, response, body) => {
    if (err) {
      this.image.error = new Error(err);
      endStream();
    } else {
      const json = JSON.parse(body);
      const imageUrl = json[0].thumbnail_large.replace('_640.jpg', '');
      require('./util/fetch')(this, imageUrl);
    }
  });
};


module.exports = Vimeo;
