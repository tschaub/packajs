var url = require('url');
var util = require('util');
var path = require('path');
var http = require('http');
var fs = require('fs');
var bower = require('bower');
var Server = require('node-static').Server;
var registry = require('../registry');

var cwd = process.cwd();
var appConfig = require(path.join(cwd, bower.config.json));
var port = 8080;

var template = path.join(__dirname, '..', '..', 'templates', 'debug-loader.js');
var templateParts = fs.readFileSync(template, 'utf8').split('{{scripts}}');

function getMain(config) {
  var main = config.main;
  if (util.isArray(main)) {
    main = main.reduce(function(prev, cur) {return /\.js$/.test(cur) ? cur : prev}, null);
  }
  if (!main) {
    throw new Error('No main JavaScript found in app component.json');
  }
  main = path.normalize(main);
  if (/^[\/\.]/.test(main)) {
    throw new Error('The main JavaScript must be a relative path witin the app directory');
  }
  return '/' + main;
}

function getScript(config) {
  return '/' + bower.config.directory + '/' + config.name + getMain(config);
}

function getComponents(errback, callback) {
  registry.getComponents(cwd).
      then(function(components) {
        callback(components);
      }).
      fail(errback);
}

var server = new Server(cwd);

var headers = {
  'Content-Type': 'application/javascript'
};

http.createServer(function(request, response) {
  var pathname = url.parse(request.url).pathname;
  var parts = pathname.split('@');

  var main = getMain(appConfig);
  request.addListener('end', function() {
    if (parts[0] === main) {
      getComponents(
          function(error) {
            response.writeHead(500, {'Content-Type': 'text/plain'});
            response.end('Server error\n');
          },
          function(components) {
            components.pop();
            var scripts = components.map(getScript);
            scripts.push(main);
            var script = parts[1];
            if (script) {
              server.serveFile(script, 200, headers, request, response);
            } else {
              var content = templateParts.join(JSON.stringify(scripts));
              response.writeHead(200, headers);
              response.end(content);
            }
          });
    } else {
      server.serve(request, response);
    }
  });
}).listen(port);

console.log('PackaJS debug server running on port ' + port);
