const fs = require('fs');
const stream = require('stream');
const env = require('../config/environment_vars');
const util = require('util');
const etag = require('etag');

function ResponseWriter(request, response, next) {
  if (!(this instanceof ResponseWriter)) {
    return new ResponseWriter(request, response);
  }

  this.request = request;
  this.response = response;

  // make sure we don't hang restify loop
  if (typeof next === 'function') {
    response.once('end', () => next(false));
  }

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
      this.response.status(statusCode);
      this.response.end();
    }

    return;
  }

  if (image.modifiers.action === 'json') {
    if (this.shouldCacheResponse()) {
      this.response.setHeader('Cache-Control', `public, max-age=${env.JSON_EXPIRY}`);
      this.response.setHeader('Expires', this.expiresIn(env.JSON_EXPIRY));
      this.response.setHeader('ETag', etag(image.contents));
      this.response.setHeader('Last-Modified', (new Date(1000)).toGMTString());
      this.response.setHeader('Vary', 'Accept-Encoding');
    }

    this.response.setHeader('Content-Type', 'application/json');
    this.response.status(200);
    this.response.end(image.contents);
    image.log.flush();

    this.end();
  }

  if (this.shouldCacheResponse()) {
    this.response.setHeader('Cache-Control', `public, max-age=${image.expiry}`);
    this.response.setHeader('Expires', this.expiresIn(image.expiry));
    this.response.setHeader('ETag', etag(image.contents));
    this.response.setHeader('Last-Modified', (new Date(1000)).toGMTString());
    this.response.setHeader('Vary', 'Accept-Encoding');
  }

  this.response.setHeader('Content-Type', `image/${image.format}`);

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

    this.response.status(200);
    this.response.end(image.contents);
  }

  // flush the log messages and close the connection
  image.log.flush();
  this.end();
};


module.exports = ResponseWriter;
