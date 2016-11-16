const sharp = require('sharp');

module.exports = (image, callback) => {
  // create the sharp object
  const r = sharp(image.contents);

  // apply the filter and pass on the stream
  r.gamma().greyscale().toBuffer(callback);
};
