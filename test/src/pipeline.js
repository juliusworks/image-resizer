// use bluebird for promises
require('any-promise/register/bluebird');

const path = require('path');
const fs = require('fs');
const Img = require('../../src/image');
const streams = require('../../src/streams');
const assert = require('assert');
const pump = require('pump');
const isStream = require('is-stream');
const streamToPromise = require('stream-to-promise');

describe('Complete pipeline', () => {
  const testFile = 'sample_images/image1.jpg';
  const imageRaw = fs.readFileSync(path.resolve(__dirname, '../', testFile));
  const filePath = (modifiers = '', ext = '') => `/elocal-${modifiers}/test/${testFile}${ext}`;
  const retrieveImage = (modifiers, ext) => new Img({ path: filePath(modifiers, ext) });

  it('retrieves image', () => {
    const image = retrieveImage();
    const stream = image.getFile();

    assert(isStream.readable(stream));

    // object mode, so will have an array of 1 image
    return streamToPromise(stream).spread((file) => {
      assert.equal(file.contents.compare(imageRaw), 0);
    });
  });

  it('go through several iterations & adjust format', (next) => {
    pump(
      retrieveImage('q10').getFile(),
      streams.identify(),
      streams.resize(),
      streams.filter(),
      streams.optimize(),
      next
    );
  });

  it('convert to png', (next) => {
    pump(
      retrieveImage('q80', '.png').getFile(),
      streams.identify(),
      streams.resize(),
      streams.filter(),
      streams.optimize(),
      next
    );
  });

  it('convert to webp', (next) => {
    pump(
      retrieveImage('q80', '.webp').getFile(),
      streams.identify(),
      streams.resize(),
      streams.filter(),
      streams.optimize(),
      next
    );
  });
});
