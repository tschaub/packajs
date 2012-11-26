var http = require('http'),
    server = require('../server');

var port = 3000;

exports.description = 'run debug server';

exports.action = function() {
  var debugServer = server.debug({
    dir: process.cwd()
  });

  http.createServer(function(request, response) {
    request.addListener('end', function() {
      debugServer(request, response);
    });
  }).listen(port);

  console.log('PackaJS debug server running on port ' + port);
};

