/* eslint-disable import/no-dynamic-require */
const env = require('./src/config/environment_vars');

module.exports = {
  env,
  img: require('./src/image'),
  streams: require('./src/streams'),
  sources: require('./src/streams/sources'),
  filter: require('./src/streams/filter'),
  modifiers: require('./src/lib/modifiers').map,
  expressConfig: require(`./src/config/${env.NODE_ENV}`),
};
