const path = require('path');
const modules = require('glob').sync(`${__dirname}/*.js`);
const utils = require('../utils/string');

const streams = {};
for (let i = 0; i < modules.length; i += 1) {
  const stream = path.basename(modules[i], '.js');
  if (stream !== 'index') {
    // eslint-disable-next-line import/no-dynamic-require
    streams[utils.camelCase(stream)] = require(modules[i]);
  }
}

module.exports = streams;
