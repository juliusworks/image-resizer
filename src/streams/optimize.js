const sharp = require('sharp');
const env = require('../config/environment_vars');
const map = require('map-stream');

module.exports = () => map((image, callback) => {
  // pass through if there is an error
  if (image.isError()) {
    return callback(null, image);
  }

  // let this pass through if we are requesting the metadata as JSON
  if (image.modifiers.action === 'json') {
    image.log.log('optimize: json metadata call');
    return callback(null, image);
  }

  image.log.time(`optimize-sharp:${image.outputFormat || image.format}`);

  const r = sharp(image.contents);

  image.log.log('format:', image.outputFormat || image.format);

  // if a specific output format is specified, set it
  r.toFormat(image.outputFormat || image.format, {
    quality: image.modifiers.quality || 100,
    progressive: !!env.IMAGE_PROGRESSIVE,
  });

  // write out the optimised image to buffer and pass it on
  return r.toBuffer((err, buffer) => {
    if (err) {
      image.log.error('optimize error', err);
      image.error = new Error(err);
    } else {
      image.contents = buffer;
    }

    image.log.timeEnd(`optimize-sharp:${image.format}`);
    callback(null, image);
  });
});
