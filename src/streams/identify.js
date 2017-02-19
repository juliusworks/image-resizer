const sharp = require('sharp');
const map = require('map-stream');

function processor(image, callback) {
  if (image.isError()) {
    return callback(null, image);
  }

  if (image.modifiers.action !== 'json') {
    image.log.log('identify:', image.log.colors.bold('no identify'));
    return callback(null, image);
  }

  const handleResponse = (err, data) => {
    image.log.timeEnd('identify');

    if (err) {
      image.log.error('identify error', err);
      image.error = new Error(err);
    } else {
      image.contents = data;
    }

    callback(null, image);
  };

  image.log.time('identify');

  return sharp(image.contents).metadata(handleResponse);
}

module.exports = () => map(processor);
