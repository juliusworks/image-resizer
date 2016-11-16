const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const dir = __dirname.split('/').slice(-1)[0];
const pluginDir = [cwd, 'plugins', dir].join('/');
const modules = {};

// get all the files from this directory
let files = require('glob').sync(`${__dirname}/*.js`);

for (let i = 0; i < files.length; i += 1) {
  const mod = path.basename(files[i], '.js');
  if (mod !== 'index') {
    // eslint-disable-next-line import/no-dynamic-require
    modules[mod] = require(files[i]);
  }
}

// get all the files from the current working directory and override the local
// ones with any custom plugins
if (fs.existsSync(pluginDir)) {
  files = require('glob').sync(`${pluginDir}/*.js`);
  for (let i = 0; i < files.length; i += 1) {
    const mod = path.basename(files[i], '.js');
    if (mod !== 'index') {
      // eslint-disable-next-line import/no-dynamic-require
      modules[mod] = require(files[i]);
    }
  }
}

module.exports = modules;
