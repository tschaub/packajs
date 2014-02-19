var http = require('http');

var log = require('npmlog');

var server = require('../server');


/**
  Command description
  @type {string}
 */
exports.description = 'run debug server';


/**
  Command options
  @type {Array.<string>}
 */
exports.options = [
  ['-p, --port <port>',
    'accept connections on the specified port [3000]', Number, 3000],
  ['-d, --directory <path>',
    'run debug server for app at the given path [.]',
    String, process.cwd()]
];


/**
  Command action
  @param {Object} options Options for command.
  @return {Server} A server that provides a script loader for all component
      scripts.
 */
exports.action = function(options) {
  if (options.parent) {
    log.level = options.parent.loglevel;
  }
  var debug = server.debug({
    directory: options.directory
  });

  var debugServer = http.createServer(debug).listen(options.port);

  log.info('PackaJS debug server running at http://localhost:' + options.port);
  return debugServer;
};

