/* eslint-disable no-console */

let client;
let bucket;

const env = require('../../config/environment_vars');
const stream = require('stream');
const util = require('util');

try {
  // init gcloud API instance
  client = require('@google-cloud/storage')({
    projectId: env.GCS_PROJECT_ID,
    credentials: {
      client_email: env.GCS_CLIENT_EMAIL,
      private_key: env.GCS_PRIVATE_KEY,
    },
  });

  // create GCS clientf
  bucket = client.bucket(env.GCS_BUCKET);
} catch (e) {
  console.info('gcs is not available', e.message);
  // we do not have gcs data
}

function GCSStream(image) {
  if (!(this instanceof GCSStream)) {
    return new GCSStream(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  return this;
}

util.inherits(GCSStream, stream.Readable);

GCSStream.prototype._read = function read() {
  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  const file = bucket.file(this.image.path.replace(/^\//, ''));
  const options = this.image.options || {};

  this.image.log.time('gcs');

  return file.download(options, (err, data) => {
    this.image.log.timeEnd('gcs');

    // if there is an error store it on the image object and pass it along
    if (err) {
      this.image.error = err;
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

module.exports = GCSStream;
