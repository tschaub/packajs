var url = require('url');
var util = require('util');
var path = require('path');
var http = require('http');
var fs = require('fs');

var log = require('npmlog');
var bower = require('bower');
var StaticServer = require('node-static').Server;

var pkg = require('./package');

var loaderTemplate = path.join(__dirname, '..', 'templates', 'debug-loader.js');
var loaderParts = fs.readFileSync(loaderTemplate, 'utf8').split('{{scripts}}');

function getMainPath(config) {
  var main = config.main;
  if (util.isArray(main)) {
    main = main.reduce(function(prev, cur) {
      return (/\.js$/).test(cur) ? cur : prev;
    }, null);
  }
  if (!main) {
    throw new Error('No main JavaScript found in app component.json');
  }
  main = path.normalize(main);
  if ((/^[\/\.]/).test(main)) {
    throw new Error(
        'The main JavaScript must be a relative path witin the app directory');
  }
  return main;
}

var headers = {
  'Content-Type': 'application/javascript'
};


/**
  Debug server
  @param {Object} config Server configuration.
  @return {Function} Function that expects a request, response, and optional
      "next" handler.  May be used as Connect-style middleware.
 */
exports.debug = function(config) {
  var appDir = config.directory;
  return function(request, response, next) {
    var staticServer = new StaticServer(appDir);
    var pathname = url.parse(request.url).pathname;
    // consume leading slash
    pathname = pathname.substring(1);
    pkg.getComponents(appDir, function(error, components) {
      if (error) {
        log.error(error.stack);
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end('Server error\n');
        return;
      }
      var main;
      try {
        main = getMainPath(components[components.length - 1]);
      } catch (error) {
        log.error(error.stack);
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end('Server error\n');
        return;
      }
      if (pathname.indexOf(main) === 0) {
        var script = pathname.substr(main.length + 1);
        if (script) {
          staticServer.serveFile(script, 200, headers, request, response)
              .on('error', function(error) {
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('Not found: ' + script + '\n');
              });
        } else {
          var scripts = [];
          components.forEach(function(component) {
            if (component.scripts) {
              scripts = scripts.concat(component.scripts.map(function(file) {
                return path.relative(appDir, file);
              }));
            }
          });
          // TODO: Windows
          var content = loaderParts.join(JSON.stringify(scripts));
          response.writeHead(200, headers);
          response.end(content);
        }
      } else {
        if (next) {
          next();
        } else {
          staticServer.serve(request, response, function(error, result) {
            if (error) {
              response.writeHead(error.status, error.headers);
              response.end(error.message);
            }
          });
        }
      }
    });
  };
};

