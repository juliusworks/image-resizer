const Img = require('../../../image');
const request = require('request');
const _ = require('lodash');

function fetch(_this, url) {
  const image = _this.image;
  const opts = {
    url,
    encoding: null,
  };

  request(opts, (err, response, body) => {
    image.log.timeEnd(_this.key);

    if (err) {
      image.error = err;
    } else if (response.statusCode === 200) {
      const contentType = _.last(response.headers['content-type'].split('/'));
      if (!_.includes(Img.validFormats, contentType)) {
        image.error = new Error(`Invalid content type: ${contentType}`);
      } else {
      // Set output format to input content-type if no explicit format is provided
        if (!image.format) {
          image.format = contentType;
        }

        image.contents = body;
        image.originalContentLength = body.length;
        _this.ended = true;
      }
    } else {
      image.error = new Error(`${_this.key} image not found`);
      image.error.statusCode = 404;
    }

    _this.push(image);
    _this.push(null);
  });
}

module.exports = fetch;
