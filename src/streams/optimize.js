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

  image.log.time(`optimize-sharp:${image.format}`);

  const r = sharp(image.contents);

  if (env.IMAGE_PROGRESSIVE) {
    r.progressive();
    // An advanced setting for progressive (interlace) JPEG output.
    // Calculates which spectrum of DCT coefficients uses the fewest bits.
    // Usually reduces file size at the cost of increased compression time.
    r.optimiseScans();
  }

  // set the output quality
  if (image.modifiers.quality < 100) {
    r.quality(image.modifiers.quality);
  }

  // An advanced setting to reduce the effects of ringing in JPEG output,
  // in particular where black text appears on a white background (or vice versa).
  r.overshootDeringing();

  // An advanced setting to apply the use of trellis quantisation with JPEG output.
  // Reduces file size and slightly increases relative quality at the cost of increased compression time.
  r.trellisQuantisation();

  // An advanced setting for the zlib compression level of the lossless PNG output format.
  r.compressionLevel(9);


  // if a specific output format is specified, set it
  if (image.outputFormat) {
    r.toFormat(image.outputFormat);
  }

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
