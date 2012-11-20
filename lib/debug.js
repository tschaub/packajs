var url = require('url');
var util = require('util');
var path = require('path');
var Server = require('node-static').Server;
var registry = require('./registry');

function getMain(config) {
  var main = config.main;
  if (util.isArray(main)) {
    main = main.reduce(function(prev, cur) {return /\.js$/.test(cur) ? cur : prev}, null);
  }
  if (!main) {
    throw new Error("No main JavaScript found in app component.json");
  }
  main = path.normalize(main);
  if (/^[\/\.]/.test(main)) {
    throw new Error("The main JavaScript must be a relative path witin the app directory");
  }
  return '/' + main;
}

function getScript(config) {
  return '/components/' + config.name + getMain(config);
}

var cwd = process.cwd();
var port = 8080;
registry.getComponents(cwd).
    then(function(components) {
      var app = components.pop();
      var main = getMain(app);
      var scripts = components.map(getScript);
      scripts.push(main);

      var server = new Server(cwd);

      require('http').createServer(function (request, response) {
        var parts = url.parse(request.url, true);
        if (parts.pathname === main) {
          request.addListener('end', function () {
            var script = parts.query.script;
            if (script) {
              server.serveFile(script, 200, {}, request, response);
            } else {
              response.writeHead(200, {"Content-Type": "application/javascript"});
              response.end(JSON.stringify(scripts));
            }
          });
        } else {
          response.writeHead(404, {"Content-Type": "text/plain"});
          response.end("Not found\n");
        }
      }).listen(port);

      console.log("PackaJS debug server running on port " + port);
    }).
    fail(function(error) {
      throw new Error(error);
    });

