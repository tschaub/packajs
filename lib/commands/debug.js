var http = require('http'),
    server = require('../server');

exports.description = 'run debug server';

exports.action = function() {
  var debugServer = server.createDebugServer({
    dir: process.cwd()
  });

  http.createServer(function(request, response) {
    request.addListener('end', function() {
      debugServer(request, response);
    });
  }).listen(8080);

  console.log('PackaJS debug server running on port ' + 8080);
};

