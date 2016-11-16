#!/usr/bin/env node

/* eslint-disable no-console */

const program = require('commander');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const chalk = require('chalk');
const pkg = require('../package.json');
const _ = require('lodash');
const exec = require('child_process').exec;

/**
File/Directory helper functions
*/
function write(fpath, str, mode) {
  fs.writeFileSync(fpath, str, { mode: mode || '0666' });
  console.log(`    ${chalk.green('create')}: ${path}`);
}

function copy(from, to) {
  write(to, fs.readFileSync(from, 'utf-8'));
}

function mkdir(fpath) {
  mkdirp.sync(fpath, '0755');
  console.log(`    ${chalk.green('create')}: ${path}`);
}

function emptyDirectory(fpath, fn) {
  fs.readdir(fpath, (err, files) => {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
    fn(!files || !files.length);
  });
}

function createApplicationAt(dir) {
  // Determine the app name from the directory
  const appName = path.basename(path.resolve(dir));

  console.log(`\n${chalk.cyan('Creating new ')}${chalk.cyan.bold('image-resizer-wjordan')}${chalk.cyan(' app!')}`);
  console.log();

  // create a new package.json
  const newPkg = {
    name: appName,
    version: '1.0.0',
    main: 'index.js',
    description: 'My awesome image resizing service!',
    engines: {
      node: pkg.engines.node,
      iojs: pkg.engines.iojs,
    },
    dependencies: {
      'image-resizer-wjordan': `~${pkg.version}`,
      express: pkg.dependencies.express,
      lodash: pkg.dependencies.lodash,
      chalk: pkg.dependencies.chalk,
      sharp: pkg.dependencies.sharp,
    },
    devDependencies: pkg.devDependencies,
  };

  write(`${dir}/package.json`, JSON.stringify(newPkg, null, 2));

  // create index.js
  const indexTmpl = fs.readFileSync(`${__dirname}/./templates/index.js.tmpl`);
  write(`${dir}/index.js`, _.template(indexTmpl, {}));

  // create the gulpfile
  copy(`${__dirname}/./templates/gulpfile.js.tmpl`, `${dir}/gulpfile.js`);

  // create .env
  const envTmpl = fs.readFileSync(`${__dirname}/./templates/.env.tmpl`);
  write(`${dir}/.env`, _.template(envTmpl, { cwd: process.cwd() }));

  // create .gitignore
  copy(`${__dirname}/./templates/.gitignore.tmpl`, `${dir}/.gitignore`);

  // create .jshintrc
  copy(`${__dirname}/../.jshintrc`, `${dir}/.jshintrc`);

  // create Heroku files
  copy(`${__dirname}/./templates/.buildpacks.tmpl`, `${dir}/.buildpacks`);
  copy(`${__dirname}/./templates/Procfile.tmpl`, `${dir}/Procfile`);

  // create a README
  copy(`${__dirname}/./templates/README.md.tmpl`, `${dir}/README.md`);

  // create plugin folders
  //  - sources
  //  - filters
  mkdir(`${dir}/plugins/sources`);
  mkdir(`${dir}/plugins/filters`);


  console.log();
  console.log(`${chalk.green('   now install your dependencies')}:`);
  console.log('     $ npm install');
  console.log();
  console.log(`${chalk.green('   then to run the app locally')}:`);
  console.log('     $ npm run watch');
  console.log();

  exec('vips --version', (err, stdout, stderr) => {
    if (err || stderr) {
      console.log(`${chalk.yellow('   looks like vips is also missing, run the following to install')}:`);
      console.log('     $ ./node_modules/image_resizer/node_modules/sharp/preinstall.sh');
      console.log();
    }

    console.log(`${chalk.yellow('   to get up and running on Heroku')}:`);
    console.log('     https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction');
    console.log();
  });
}

/**
Create the program and list the possible commands
*/
program.version(pkg.version);
program.option('-f, --force', 'force app build in an non-empty directory');
program.command('new')
  .description('Create new clean image-resizer app')
  .action(() => {
    const fpath = '.';
    emptyDirectory(fpath, (empty) => {
      if (empty || program.force) {
        createApplicationAt(fpath);
      } else {
        console.log(
          chalk.red('\n    The current directory is not empty, please use the force (-f) option to proceed.\n')
        );
      }
    });
  });

program.command('filter <name>')
  .description('Create new filter stream')
  .action((filterName) => {
    copy(`${__dirname}/./templates/filter.js.tmpl`, `./plugins/filters/${filterName}.js`);
  });

program.parse(process.argv);
