/* eslint-disable no-console */

const stream = require('stream');
const util = require('util');
const env = require('../../config/environment_vars');
const Twit = require('twit');
const _ = require('lodash');

let t;

/* jshint camelcase:false */
try {
  t = new Twit({
    consumer_key: env.TWITTER_CONSUMER_KEY,
    consumer_secret: env.TWITTER_CONSUMER_SECRET,
    access_token: env.TWITTER_ACCESS_TOKEN,
    access_token_secret: env.TWITTER_ACCESS_TOKEN_SECRET,
  });
} catch (e) {
  console.info('tw is not available', e.message);
  // we do not have s3 data
}


function Twitter(image) {
  if (!(this instanceof Twitter)) {
    return new Twitter(image);
  }

  stream.Readable.call(this, { objectMode: true });
  this.image = image;
  this.ended = false;
  this.key = 'twitter';

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Twitter, stream.Readable);

Twitter.prototype._read = function read() {
  let queryString;

  if (this.ended) return null;

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  // pass through the stream with an error if the twit library didnt start
  if (!t) {
    this.image.error = new Error('Need valid twitter credentials');
    this.push(this.image);
    return this.push(null);
  }

  const endStream = () => {
    this.ended = true;
    this.push(this.image);
    this.push(null);
  };

  this.image.log.time(this.key);

  const profileId = this.image.image.split('.')[0];

  if (_.isNaN(profileId * 1)) {
    queryString = { screen_name: profileId };
  } else {
    queryString = { user_id: profileId };
  }

  return t.get('users/show', queryString, (err, data) => {
    if (err) {
      this.image.error = new Error(err);
      endStream();
    } else {
      const imageUrl = data.profile_image_url
        .replace('_normal', '')
        .replace('_bigger', '')
        .replace('_mini', '');

      require('./util/fetch')(this, imageUrl);
    }
  });
};

module.exports = Twitter;
