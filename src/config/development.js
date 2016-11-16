const env = require('./environment_vars');
const morgan = require('morgan');
const errorHandler = require('errorhandler');

module.exports = (app) => {
  app.set('views', `${env.LOCAL_FILE_PATH}/test`);
  // eslint-disable-next-line
  app.engine('html', require('ejs').renderFile);
  app.set('port', env.PORT || 3001);
  app.use(morgan('dev'));
  app.use(errorHandler());
};
