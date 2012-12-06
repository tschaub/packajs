var http = require('http'),
    log = require('npmlog'),
    server = require('../server');

exports.options = [
  ['-p, --port <port>', 'accept connections on the specified port [3000]', Number, 3000],
  ['-d, --directory <path>', 'run debug server for app at the given path [.]', String, process.cwd()]
];

exports.description = 'run debug server';

exports.action = function(options) {
  if (options.parent) {
    log.level = options.parent.loglevel;
  }
  var debug = server.debug({
    directory: options.directory
  });

  var debugServer = http.createServer(function(request, response) {
    request.addListener('end', function() {
      debug(request, response);
    });
  }).listen(options.port);

  log.info('PackaJS debug server running on port ' + options.port);
  return debugServer;
};

