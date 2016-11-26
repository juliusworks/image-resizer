/* eslint-disable no-console */

const env = require('../config/environment_vars');
const chalk = require('chalk');
const _ = require('lodash');

const prefix = env.LOG_PREFIX;
const queueLog = env.QUEUE_LOG;
const silent = env.IR_LOG;

chalk.enabled = true;

class Logger {
  constructor() {
    this.queue = [];
    this.times = {};
    this.queueLog = queueLog;
    this.colors = chalk;
  }

  log(...args) {
    if (this.queueLog) {
      this.queue.push({ method: 'log', args });
    } else {
      args.unshift(`[${chalk.green(prefix)}]`);
      console.log(...args);
    }
  }

  error(...args) {
    if (this.queueLog) {
      this.queue.push({ method: 'error', args });
    } else {
      args.unshift(`[${chalk.green(prefix)}]`);
      console.error(...args);
    }
  }

  time(_key) {
    let key = _key;

    if (this.queueLog) {
      this.times[key] = process.hrtime();
    } else {
      key = `[${chalk.green(prefix)}] ${chalk.cyan(key)}`;
      console.time.call(console, key);
    }
  }

  timeEnd(_key) {
    let key = _key;

    if (this.queueLog) {
      const time = process.hrtime(this.times[key]);
      this.queue.push({ method: 'time', key, time });
    } else {
      key = `[${chalk.green(prefix)}] ${chalk.cyan(key)}`;
      console.timeEnd.call(console, key);
    }
  }

  flush() {
    if (this.queue.length === 0) {
      return;
    }

    if (silent) {
      this.queue = null;
      return;
    }

    console.log('');

    _.each(this.queue, (item) => {
      let log = '';
      log += `[${chalk.green(prefix)}] `;

      // eslint-disable-next-line default-case
      switch (item.method) {
        case 'log':
          _.each(item.args, (arg) => {
            log += `${arg.toString()} `;
          });
          break;
        case 'error':
          _.each(item.args, (arg) => {
            log += `${chalk.red(arg.toString())} `;
          });
          break;
        case 'time':

          log += chalk.cyan(
          `${item.key} - ${chalk.bold(`${item.time[0]}s ${item.time[1] / 1000000}ms`)}`
        );
          break;
      }

      console.log(log);
    });
  }
}

module.exports = Logger;
