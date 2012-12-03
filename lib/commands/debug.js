var http = require('http'),
    log = require('npmlog'),
    server = require('../server');

var port = 3000;

exports.description = 'run debug server';

exports.action = function(options) {
  if (options && options.parent) {
    log.level = options.parent.loglevel;
  }
  var debugServer = server.debug({
    dir: process.cwd()
  });

  http.createServer(function(request, response) {
    request.addListener('end', function() {
      debugServer(request, response);
    });
  }).listen(port);

  log.info('PackaJS debug server running on port ' + port);
};

