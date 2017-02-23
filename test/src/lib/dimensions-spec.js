const chai = require('chai');
const dim = require('../../../src/lib/dimensions');

chai.should();

describe('Dimensions module', () => {
  describe('#gravity', () => {
    const gravity = ['c', 600, 400, 100, 100];

    it('should return correct values for center gravity', () => {
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(150);
    });

    it('should return correct values for north gravity', () => {
      gravity[0] = 'n';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(0);
    });

    it('should return correct values for northeast gravity', () => {
      gravity[0] = 'ne';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(0);
    });

    it('should return correct values for northwest gravity', () => {
      gravity[0] = 'nw';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(0);
    });

    it('should return correct values for south gravity', () => {
      gravity[0] = 's';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(300);
    });

    it('should return correct values for southeast gravity', () => {
      gravity[0] = 'se';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(300);
    });

    it('should return correct values for southwest gravity', () => {
      gravity[0] = 'sw';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(300);
    });

    it('should return correct values for east gravity', () => {
      gravity[0] = 'e';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(150);
    });

    it('should return correct values for west gravity', () => {
      gravity[0] = 'w';
      const g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(150);
    });
  });


  describe('#cropFill', () => {
    const modifiers = { gravity: 'c', height: 50, width: 50 };
    const size = { height: 400, width: 600 };

    it('should return correct values for default gravity', () => {
      const s = dim.cropFill(modifiers, size);
      s.resize.height.should.equal(50);
      s.crop.x.should.equal(Math.floor((((50 / 400) * 600) - 50) / 2));
    });

    it('should return correct values for northeast gravity', () => {
      modifiers.gravity = 'ne';
      const s = dim.cropFill(modifiers, size);
      s.crop.x.should.equal(25);
      s.crop.y.should.equal(0);
    });

    it('should return correct values for southeast gravity', () => {
      modifiers.gravity = 'se';
      const s = dim.cropFill(modifiers, size);
      s.crop.x.should.equal(25);
      s.crop.y.should.equal(0);
    });

    it('should crop the largest dimension', () => {
      const mods = { gravity: 'c', height: 40, width: 50 };
      const s = dim.cropFill(mods, size);
      s.crop.height.should.equal(40);
      s.crop.width.should.equal(50);
    });
  });


  describe('#xy', () => {
    const modifiers = { gravity: 'se', height: 50, width: 50, x: 10, y: 15 };
    const size = { height: 400, width: 600 };

    it('should use the x/y values instead of defined gravity', () => {
      const s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(modifiers.x);
      s.y.should.equal(modifiers.y);
    });

    it('should not exceed bounds on x value', () => {
      modifiers.width = 90;
      modifiers.x = 700;
      modifiers.y = 40;
      const s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(510);
      s.y.should.equal(40);
      s.x.should.not.equal(modifiers.x);
      s.y.should.equal(modifiers.y);
    });

    it('should not exceed bounds on y value', () => {
      modifiers.height = 90;
      modifiers.x = 60;
      modifiers.y = 700;
      const s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(60);
      s.y.should.equal(310);
      s.x.should.equal(modifiers.x);
      s.y.should.not.equal(modifiers.y);
    });
  });
});
