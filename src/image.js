const _ = require('lodash');
const Logger = require('./utils/logger');
const env = require('./config/environment_vars');
const modifiers = require('./lib/modifiers');
const stream = require('stream');
const util = require('util');
const imgType = require('image-type');

// Simple stream to represent an error at an early stage, for instance a
// request to an excluded source.
function ErrorStream(image) {
  stream.Readable.call(this, { objectMode: true });
  this.image = image;
}
util.inherits(ErrorStream, stream.Readable);

ErrorStream.prototype._read = function read() {
  this.push(this.image);
  this.push(null);
};

function Image(request, options) {
  // placeholder for any error objects
  this.error = null;

  // set a mark for the start of the process
  this.mark = Date.now();

  // determine the name and format (mime) of the requested image
  this.parseImage(request);

  // determine the requested modifications
  this.modifiers = modifiers.parse(request.path);

  // pull the various parts needed from the request params
  this.parseUrl(request);

  // placeholder for the buffer/stream coming from s3, will hold the image
  this.contents = null;

  // placeholder for the size of the original image
  this.originalContentLength = 0;

  // set the default expiry length, can be altered by a source file
  this.expiry = env.IMAGE_EXPIRY;

  // fetch options for specific sources
  this.options = options || {};

  // all logging strings will be queued here to be written on response
  this.log = new Logger();
}

Image.validInputFormats = ['jpeg', 'jpg', 'gif', 'png', 'webp'];
Image.validOutputFormats = ['jpeg', 'png', 'webp'];

// Determine the name and format of the requested image
Image.prototype.parseImage = function parseImage(request) {
  let fileStr = _.last(request.path.split('/'));
  const exts = fileStr.split('.');

  // clean out any metadata format
  if (exts[exts.length - 1] === 'json') {
    this.format = exts[exts.length - 2].toLowerCase();
    exts.pop();
    fileStr = exts.join('.');
  }

  // if path contains valid output format, remove it from path
  if (exts.length >= 3) {
    const inputFormat = exts[exts.length - 2].toLowerCase();
    const outputFormat = exts.pop().toLowerCase();

    if (_.indexOf(Image.validInputFormats, inputFormat) > -1 &&
        _.indexOf(Image.validOutputFormats, outputFormat) > -1) {
      this.outputFormat = outputFormat;
      fileStr = exts.join('.');
    }
  }

  this.image = fileStr;
};

// Determine the file path for the requested image
Image.prototype.parseUrl = function parseUrl(request) {
  const parts = request.path.replace(/^\//, '').split('/');

  // overwrite the image name with the parsed version so metadata requests do
  // not mess things up
  parts[parts.length - 1] = this.image;

  // if there is a modifier string remove it
  if (this.modifiers.hasModStr) {
    parts.shift();
  }

  this.path = parts.join('/');

  // account for any spaces in the path
  this.path = decodeURI(this.path);
};

Image.prototype.isError = function isError() {
  return this.error !== null;
};

Image.prototype.isStream = function isStream() {
  const Stream = require('stream').Stream;
  return !!this.contents && this.contents instanceof Stream;
};

Image.prototype.isBuffer = function isBuffer() {
  return !!this.contents && Buffer.isBuffer(this.contents);
};

Image.prototype.getFile = () => {
  const sources = require('./streams/sources');
  const excludes = env.EXCLUDE_SOURCES ? env.EXCLUDE_SOURCES.split(',') : [];

  let streamType = env.DEFAULT_SOURCE;
  let Stream = null;

  // look to see if the request has a specified source
  if (_.has(this.modifiers, 'external')) {
    if (_.has(sources, this.modifiers.external) || _.has(env.externalSources, this.modifiers.external)) {
      streamType = this.modifiers.external;
    }
  }

  // if this request is for an excluded source create an ErrorStream
  if (excludes.indexOf(streamType) > -1) {
    this.error = new Error(`${streamType} is an excluded source`);
    Stream = ErrorStream;
  } else if (_.has(sources, streamType)) {
    // if all is well find the appropriate stream
    this.log.log('new stream created!');
    Stream = sources[streamType];
  } else if (_.has(env.externalSources, streamType)) {
    this.log.log('new external stream created!');
    Stream = sources.external;
    return new Stream(this, streamType, env.externalSources[streamType]);
  } else {
    this.error = new Error(`${streamType} is not a valid source`);
    Stream = ErrorStream;
  }

  return new Stream(this);
};

Image.prototype.sizeReduction = function reduction() {
  const size = this.contents.length;
  return (this.originalContentLength - size) / 1000;
};

Image.prototype.sizeSaving = function sizeSaving() {
  const oCnt = this.originalContentLength;
  const size = this.contents.length;
  return (((oCnt - size) / oCnt) * 100).toFixed(2);
};

Image.prototype.isFormatValid = function isFormatValid() {
  if (Image.validInputFormats.indexOf(this.format) === -1) {
    this.error = new Error(
      `The listed format (${this.format}) is not valid.`
    );
  }
};

// Setter/getter for image format that normalizes jpeg formats
Object.defineProperty(Image.prototype, 'format', {
  get() { return this._format; },
  set(value) {
    this._format = value.toLowerCase();
    if (this._format === 'jpg') { this._format = 'jpeg'; }
  },
});

// Setter/getter for image contents that determines the format from the content
// of the image to be processed.
Object.defineProperty(Image.prototype, 'contents', {
  get() { return this._contents; },
  set(data) {
    this._contents = data;

    if (this.isBuffer()) {
      this.format = imgType(data).ext;
      this.isFormatValid();
    }
  },
});

module.exports = Image;
