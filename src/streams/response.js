const fs = require('fs');
const stream = require('stream');
const env = require('../config/environment_vars');
const util = require('util');

function ResponseWriter(request, response) {
  if (!(this instanceof ResponseWriter)) {
    return new ResponseWriter(request, response);
  }

  this.request = request;
  this.response = response;

  stream.Writable.call(this, { objectMode: true });
}

util.inherits(ResponseWriter, stream.Writable);

ResponseWriter.prototype.expiresIn = (maxAge) => {
  const dt = Date.now() + (maxAge * 1000);
  return (new Date(dt)).toGMTString();
};

ResponseWriter.prototype.shouldCacheResponse = () => {
  if (env.development) {
    if (env.CACHE_DEV_REQUESTS) {
      return true;
    }

    return false;
  }

  return true;
};

ResponseWriter.prototype._write = function write(image) {
  if (image.isError()) {
    image.log.error(image.error.message);
    image.log.flush();
    const statusCode = image.error.statusCode || 500;

    if (statusCode === 404 && env.IMAGE_404) {
      this.response.status(404);
      fs.createReadStream(env.IMAGE_404).pipe(this.response);
    } else {
      this.response.status(statusCode).end();
    }

    return;
  }

  if (image.modifiers.action === 'json') {
    if (this.shouldCacheResponse()) {
      this.response.set({
        'Cache-Control': `public, max-age=${env.JSON_EXPIRY}`,
        Expires: this.expiresIn(env.JSON_EXPIRY),
        'Last-Modified': (new Date(1000)).toGMTString(),
        Vary: 'Accept-Encoding',
      });
    }

    this.response.status(200).json(image.contents);
    image.log.flush();

    this.end();
  }

  if (this.shouldCacheResponse()) {
    this.response.set({
      'Cache-Control': `public, max-age=${image.expiry}`,
      Expires: this.expiresIn(image.expiry),
      'Last-Modified': (new Date(1000)).toGMTString(),
      Vary: 'Accept-Encoding',
    });
  }

  this.response.type(image.format);

  if (image.isStream()) {
    image.contents.pipe(this.response);
  } else {
    image.log.log(
      'original image size:',
      image.log.colors.grey(
        `${(image.originalContentLength / 1000).toString()}kb`
      )
    );
    image.log.log(
      'size saving:',
      image.log.colors.grey(`${image.sizeSaving()}%`)
    );

    // as a debugging step print a checksum for the modified image, so we can
    // track to see if the image is replicated effectively between requests
    if (env.development) {
      const crypto = require('crypto');
      const shasum = crypto.createHash('sha1');
      shasum.update(image.contents);
      image.log.log('checksum', shasum.digest('hex'));
    }

    this.response.status(200).send(image.contents);
  }

  // flush the log messages and close the connection
  image.log.flush();
  this.end();
};

module.exports = ResponseWriter;
