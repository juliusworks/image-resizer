const env = require('../../config/environment_vars');
const fs = require('fs');
const stream = require('stream');
const util = require('util');

function Local(image) {
  if (!(this instanceof Local)) {
    return new Local(image);
  }
  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.path = image.path.replace(/^elocal/i, '');
  this.filePath = `${env.LOCAL_FILE_PATH}/${this.path}`;
  this.ended = false;
}

util.inherits(Local, stream.Readable);

Local.prototype._read = function read() {
  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  this.image.log.time('local filesystem');

  return fs.readFile(this.filePath, (err, data) => {
    this.image.log.timeEnd('local filesystem');

    // if there is an error store it on the image object and pass it along
    if (err) {
      this.image.error = err;

      if (err.code === 'ENOENT') {
        this.image.error.statusCode = 404;
      }
    } else {
      // if not store the image buffer
      this.image.contents = data;
      this.image.originalContentLength = data.length;
    }

    this.ended = true;
    this.push(this.image);
    this.push(null);
  });
};


module.exports = Local;
