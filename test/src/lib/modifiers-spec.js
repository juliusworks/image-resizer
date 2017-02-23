const chai = require('chai');
const _ = require('lodash');
const env = require('../../../src/config/environment_vars');
const mod = require('../../../src/lib/modifiers');

const expect = chai.expect;
chai.should();

describe('Modifiers module', () => {
  // Metadata calls
  describe('Metadata request', () => {
    it('should recognise a metadata call', () => {
      const request = '/path/to/image.png.json';
      mod.parse(request).action.should.equal('json');
    });

    it('should disregard modifiers in a metadata call', () => {
      const request = '/s50-gne/path/to/image.png.json';
      mod.parse(request).action.should.equal('json');
    });
  });


  // Original image
  describe('No modifiers', () => {
    it('should recognise no modifiers and return original action', () => {
      const request = '/path/to/image.png';
      mod.parse(request).action.should.equal('original');
    });

    it('should not return original if there are valid modifiers', () => {
      let request = '/h500/path/to/image.jpg';
      mod.parse(request).action.should.not.equal('original');
      request = '/h500-gne/path/to/image.jpg';
      mod.parse(request).action.should.not.equal('original');
    });

    it('Should add in a width parameter if MAX_IMAGE_DIMENSION specified', () => {
      const request = '/path/to/image.png';
        // override max image width environment variable
      const localEnv = _.clone(env);
      localEnv.MAX_IMAGE_DIMENSION = '500';
      mod.parse(request, undefined, localEnv).width.should.equal(500);
      mod.parse(request, undefined, localEnv).height.should.equal(500);
    });
  });


  // Gravity
  describe('Gravity', () => {
    it('should read gravity as a modifier string', () => {
      const request = '/s50-gne/path/to/image.jpg';
      mod.parse(request).gravity.should.equal('ne');
    });

    it('gravity should not be case sensitive', () => {
      const request = '/s50-gNE/path/to/image.jpg';
      mod.parse(request).gravity.should.equal('ne');
    });

    it('should not accept a non-valid gravity value', () => {
      const request = '/s50-gnorth/path/to/image.jpg';
      mod.parse(request).gravity.should.not.equal('north');
    });

    it('should set the action to square', () => {
      const request = '/s50-gne/path/to/image.jpg';
      mod.parse(request).action.should.equal('square');
    });

    it('should set the action to crop', () => {
      const request = '/h400-w600-gse/path/to/image.jpg';
      mod.parse(request).action.should.equal('crop');
    });
    it('should limit the parameter width to the MAX_IMAGE_DIMENSION if set', () => {
      const request = '/h400-w600-gse/path/to/image.jpg';
      const localEnv = _.clone(env);
      localEnv.MAX_IMAGE_DIMENSION = '500';
      mod.parse(request, undefined, localEnv).width.should.equal(500);
    });
    it('should set the width to original parameter width if less than the MAX_IMAGE_DIMENSION', () => {
      const request = '/h400-w600-gse/path/to/image.jpg';
      const localEnv = _.clone(env);
      localEnv.MAX_IMAGE_DIMENSION = '700';
      mod.parse(request, undefined, localEnv).width.should.equal(600);
    });
  });


  // Square
  describe('Square', () => {
    it('should set action to square', () => {
      const request = '/s500/path/to/image.jpg';
      mod.parse(request).action.should.equal('square');
    });

    it('should set the height and width correctly', () => {
      const request = '/s500/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(500);
    });
    it('should not allow a crop value other than the fill', () => {
      const request = '/s500-gne-cfill/image.jpg';
      mod.parse(request).crop.should.equal('fill');
    });
  });

  describe('Pad', () => {
    it('should set crop to pad', () => {
      const request = '/w300-h500-cpad/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(300);
      mod.parse(request).crop.should.equal('pad');
    });

    it('should set background color when crop is pad', () => {
      const request = '/w300-h500-cpad-b000000/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(300);
      mod.parse(request).crop.should.equal('pad');
      mod.parse(request).paddingColor.should.equal('#000000');
    });

    it('must ignore malformed modifier', () => {
      const request = '/w300-h500-cpad-b0dads1200000/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(300);
      mod.parse(request).crop.should.equal('pad');
      expect(mod.parse(request).paddingColor).to.be.equal(undefined);
    });

    it('must ignore malformed modifier', () => {
      const request = '/w300-h500-cpad-gggfff/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(300);
      mod.parse(request).crop.should.equal('pad');
      expect(mod.parse(request).paddingColor).to.be.equal(undefined);
    });
  });

  // Height
  describe('Height requests', () => {
    it('should set the action to resize', () => {
      const request = '/h400/path/to/image.png';
      mod.parse(request).action.should.equal('resize');
    });
    it('should set the height and leave the width as null', () => {
      const request = '/h400/image.png';
      const p = mod.parse(request);

      expect(p.height).to.equal(400);
      expect(p.width).to.be.equal(null);
    });
  });


  // Width
  describe('Width requests', () => {
    it('should set the action to resize', () => {
      const request = '/w400/path/to/image.png';
      mod.parse(request).action.should.equal('resize');
    });
    it('should set the width and leave the height as null', () => {
      const request = '/w400/image.png';
      const p = mod.parse(request);

      expect(p.width).to.equal(400);
      expect(p.height).to.be.equal(null);
    });
  });


  describe('Named modifiers', () => {
    const nm = {
      'small-avatar': {
        square: 60,
      },
      'large-avatar': {
        square: 120,
      },
      gallery: {
        height: 400,
        width: 600,
      },
      thumb: {
        gravity: 'ne',
        square: 50,
        external: 'local',
      },
    };

    it('should read a thumbnail named config and set accordingly', () => {
      const request = '/thumb/path/to/image.png';
      const tn = nm.thumb;

      mod.parse(request, nm).gravity.should.equal(tn.gravity);
      mod.parse(request, nm).height.should.equal(tn.square);
      mod.parse(request, nm).width.should.equal(tn.square);
    });

    it('should read a gallery named config and set accordingly', () => {
      const request = '/gallery/path/to/image.png';
      const tn = nm.gallery;

      mod.parse(request, nm).height.should.equal(tn.height);
      mod.parse(request, nm).width.should.equal(tn.width);
    });
  });

  // Quality
  describe('Quality requests', () => {
    it('should leave the action as original', () => {
      const request = '/q90/path/to/image.png';
      mod.parse(request).action.should.equal('original');
    });
    it('should set the quality', () => {
      const request = '/q90/image.png';
      const p = mod.parse(request);
      expect(p.quality).to.equal(90);
    });
    it('should clamp out of range quality values', () => {
      let request;
      let p;

      request = '/q101/image.png';
      p = mod.parse(request);
      expect(p.quality).to.equal(100);

      request = '/q0/image.png';
      p = mod.parse(request);
      expect(p.quality).to.equal(1);
    });
    it('should use environment for default quality value', () => {
      const request = '/image.png';
      const p = mod.parse(request);
      expect(p.quality).to.equal(env.IMAGE_QUALITY);
    });
    it('should ignore invalid quality value', () => {
      const request = '/qinvalid/image.png';
      const p = mod.parse(request);
      expect(p.quality).to.equal(env.IMAGE_QUALITY);
    });
  });
});
