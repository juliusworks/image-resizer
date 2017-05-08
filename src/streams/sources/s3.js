/* eslint-disable no-console */

let client;
let bucket;

const env = require('../../config/environment_vars');
const stream = require('stream');
const util = require('util');

try {
  // create an AWS S3 client with the config data
  const S3 = require('aws-sdk').S3;
  client = new S3({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
  });
  bucket = env.S3_BUCKET;
} catch (e) {
  console.info('s3 is not available', e.message);
  // we do not have s3 data
}


function S3Stream(image) {
  if (!(this instanceof S3Stream)) {
    return new S3Stream(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
}

util.inherits(S3Stream, stream.Readable);

S3Stream.prototype._read = function read() {
  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  // Set the AWS options
  const awsOptions = {
    Bucket: bucket,
    Key: this.image.path.replace(/^\//, ''),
  };

  this.image.log.time('s3');

  return client.getObject(awsOptions, (err, data) => {
    this.image.log.timeEnd('s3');

    // if there is an error store it on the image object and pass it along
    if (err) {
      this.image.error = err;
    } else {
      // if not store the image buffer
      this.image.contents = data.Body;
      this.image.originalContentLength = data.Body.length;
    }

    this.ended = true;
    this.push(this.image);
    this.push(null);
  });
};

module.exports = S3Stream;
