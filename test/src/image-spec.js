const path = require('path');
const fs = require('fs');
const Img = require('../../src/image');
const assert = require('assert');

describe('Image class', () => {
  describe('#format', () => {
    it('should normalise the format from the request', () => {
      const img = new Img({ path: '/path/to/image.JPEG' });
      img.format = 'JPEG';
      assert.equal(img.format, 'jpeg');
    });

    it('should still get format from a metadata request', () => {
      const img = new Img({ path: '/path/to/image.jpg.json' });
      assert.equal(img.format, 'jpeg');
    });
  });

  describe('#content', () => {
    it('should set the format based on the image data', () => {
      const imgSrc = path.resolve(__dirname, '../sample_images/image1.jpg');
      const buf = fs.readFileSync(imgSrc);
      const img = new Img({ path: '/path/to/image.jpg' });

      img.contents = buf;
      assert.equal(img.format, 'jpeg');
    });
  });

  describe('#parseImage', () => {
    it('should retrieve image name from the path', () => {
      const img = new Img({ path: '/path/to/image.jpg' });
      assert.equal(img.image, 'image.jpg');
    });

    it('should retrieve image from the path with .json in title', () => {
      const img = new Img({ path: '/path/to/some.image.with.json.jpg' });
      assert.equal(img.image, 'some.image.with.json.jpg');
    });

    it('should retrieve image name from path even for metadata', () => {
      const img = new Img({ path: '/path/to/image.jpg.json' });
      assert.equal(img.image, 'image.jpg');
    });

    it('should handle image names with dashes', () => {
      const dashed = '8b0ccce0-0a6c-4270-9bc0-8b6dfaabea19.jpg';
      const img = new Img({ path: `/path/to/${dashed}` });
      assert.equal(img.image, dashed);
    });

    it('should handle metadata for image names with dashes', () => {
      const dashed = '8b0ccce0-0a6c-4270-9bc0-8b6dfaabea19.jpg';
      const img = new Img({ path: `/path/to/${dashed}.json` });
      assert.equal(img.image, dashed);
    });

    it('should handle image names with underscores', () => {
      const underscored = '8b0ccce0_0a6c_4270_9bc0_8b6dfaabea19.jpg';
      const img = new Img({ path: `/path/to/${underscored}` });
      assert.equal(img.image, underscored);
    });

    it('should handle image names with periods', () => {
      const perioded = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg';
      const img = new Img({ path: `/path/to/${perioded}` });
      assert.equal(img.image, perioded);
    });

    it('should handle metadata for image names with periods', () => {
      const perioded = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg';
      const img = new Img({ path: `/path/to/${perioded}.json` });
      assert.equal(img.image, perioded);
    });

    describe('#outputFormat', () => {
      it('should exclude second output format from image path', () => {
        const image = 'image.jpg';
        const img = new Img({ path: `/path/to/${image}.webp` });

        assert.equal(img.outputFormat, 'webp');
        assert.equal(img.image, image);
        assert.equal(img.path, `path/to/${image}`);
      });

      it('should still get output format from perioded file name', () => {
        const image = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg';
        const img = new Img({ path: `/path/to/${image}.webp` });
        assert.equal(img.outputFormat, 'webp');
        assert.equal(img.image, image);
        assert.equal(img.path, `path/to/${image}`);
      });
    });
  });


  describe('#parseUrl', () => {
    it('should return a clean path', () => {
      const img = new Img({ path: '/path/to/image.jpg.json' });
      assert.equal(img.path, 'path/to/image.jpg');
    });
    it('should return path even with modifiers', () => {
      const img = new Img({ path: '/s50-gne/path/to/image.jpg' });
      assert.equal(img.path, 'path/to/image.jpg');
    });
    it('should return path when only the source is specified', () => {
      const img = new Img({ path: '/elocal/path/to/image.jpg' });
      assert.equal(img.path, 'path/to/image.jpg');
    });
  });


  describe('local formats', () => {
    it('should recognise a local source', () => {
      const localPath = '/elocal/path/to/image.png';
      const img = new Img({ path: localPath });
      assert.equal(img.modifiers.external, 'local');
    });
  });


  // describe('bad formats', function(){
  //   it('should set error if the format is not valid', function(){
  //     var img = new Img({path: '/path/to/image.tiff'});
  //     img.error.message.should.eq(Img.formatErrorText);
  //   });
  // });

  it('should respond in an error state', () => {
    const img = new Img({ path: '/path/to/image.jpg' });
    img.error = new Error('sample error');
    assert(img.isError());
  });
});
