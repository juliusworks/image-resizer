const morgan = require('morgan');
const errorHandler = require('errorhandler');

module.exports = (app) => {
  app.set('port', process.env.PORT || 3001);
  app.use(morgan('dev'));
  app.use(errorHandler());
};
