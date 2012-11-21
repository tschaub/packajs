var fs = require('fs');
var url = require('url');
var util = require('util');
var path = require('path');
var http = require('http');
var fs = require('fs');
var bower = require('bower');
var StaticServer = require('node-static').Server;
var pkg = require('./package');

var loaderTemplate = path.join(__dirname, '..', 'templates', 'debug-loader.js');
var loaderParts = fs.readFileSync(loaderTemplate, 'utf8').split('{{scripts}}');

function getMainPath(config) {
  var main = config.main;
  if (util.isArray(main)) {
    main = main.reduce(function(prev, cur) {return (/\.js$/).test(cur) ? cur : prev;}, null);
  }
  if (!main) {
    throw new Error('No main JavaScript found in app component.json');
  }
  main = path.normalize(main);
  if ((/^[\/\.]/).test(main)) {
    throw new Error('The main JavaScript must be a relative path witin the app directory');
  }
  return main;
}

function getScriptPath(config) {
  return bower.config.directory + '/' + config.name + '/' + getMainPath(config);
}

var headers = {
  'Content-Type': 'application/javascript'
};


exports.createDebugServer = function(config) {
  var dir = config.dir;
  var appConfig;
  try {
    appConfig = require(path.join(dir, bower.config.json));
  } catch (error) {
    console.error('Not a valid package (no %s found in %s)', bower.config.json, dir);
    process.exit(1);
  }
  var main = getMainPath(appConfig);
  var staticServer = new StaticServer(dir);
  return function(request, response) {
    var pathname = url.parse(request.url).pathname;
    // consume leading slash
    pathname = pathname.substring(1);
    if (pathname.indexOf(main) === 0) {
      pkg.getComponents(dir)
          .then(function(components) {
            components.pop();
            var scripts = components.map(getScriptPath);
            scripts.push(main);
            var script = pathname.substr(main.length + 1);
            if (script) {
              if (fs.existsSync(script)) {
                staticServer.serveFile(script, 200, headers, request, response);
              } else {
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('Not found: ' + script + '\n');
              }
            } else {
              var content = loaderParts.join(JSON.stringify(scripts));
              response.writeHead(200, headers);
              response.end(content);
            }
          })
          .fail(function(error) {
            response.writeHead(500, {'Content-Type': 'text/plain'});
            response.end('Server error\n');
          });
    } else {
      staticServer.serve(request, response);
    }
  };
};

