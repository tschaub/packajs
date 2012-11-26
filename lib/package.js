var path = require('path');
var util = require('util');
var fs = require('fs');
var bower = require('bower');

var registry = {};

function walk(dir, match, callback) {
  var files = [];
  fs.readdir(dir, function(error, entries) {
    if (error) {
      return callback(error);
    }
    var pending = entries.length;
    if (!pending) {
      return callback(null, files);
    }
    entries.forEach(function(entry) {
      var file = path.join(dir, entry);
      fs.stat(file, function(error, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, match, function(err, res) {
            --pending;
            files = files.concat(res);
            if (!pending) {
              callback(null, files);
            }
          });
        } else {
          --pending;
          if (match(file)) {
            files.push(file);
          }
          if (!pending) {
            callback(null, files);
          }
        }
      });
    });
  });
}

var js = /\.js$/;
var isJS = js.test.bind(js);

function getComponentScripts(component, callback) {
  if (!('scripts' in component)) {
    var main = component.main;
    if (util.isArray(main)) {
      main = main.reduce(function(prev, cur) {return isJS(cur) ? cur : prev;}, null);
    }
    if (!main) {
      return callback(new Error('No main JavaScript found in app component.json'));
    }
    main = path.normalize(main);
    if ((/^[\/\.]/).test(main)) {
      return callback(new Error('The main JavaScript must be a relative path witin the app directory'));
    }
    // TODO: decide if component.json should have non-js main (e.g. rickshaw)
    if (!isJS(main)) {
      main += ".js";
    }
    component.scripts = [path.join(component.dir, main)];
  }
  if (!util.isArray(component.scripts)) {
    // TODO: deal with non-dir
    var dir = path.join(component.dir, component.scripts),
        scripts = [];

    walk(dir, isJS, function(error, files) {
      if (error) {
        return callback(error);
      }
      component.scripts = files;
      callback(null, component);
    });

  } else {
    process.nextTick(function() {
      callback(null, component);
    });
  }
};

function getComponentsSources(components, callback) {
  var len = components.length,
      count = 0,
      error = null;

  if (len > 0) {
    components.forEach(function(component) {
      getComponentScripts(component, function(err, component) {
        if (err) {
          error = err;
        }
        ++count;
        if (count === len) {
          callback(error, components);
        }
      });
    });
  } else {
    process.nextTick(function() {
      callback(error, components);
    });
  }
}

exports.getComponents = function(dir, callback) {

  try {
    process.chdir(dir);
    var json = bower.config.json;
    var config = require(path.join(dir, json));
    config.dir = dir;
    if (!registry.hasOwnProperty(config.name)) {
      var emitter = bower.commands.list({map: true});
      emitter.on('error', callback);
      emitter.on('data', function(tree) {
        var components = sortDependencies(tree).map(function(name) {
          var componentDir = path.join(dir, bower.config.directory, name);
          var componentConfig = require(path.join(componentDir, json));
          componentConfig.dir = componentDir;
          return componentConfig;
        });
        components.push(config);
        getComponentsSources(components, function(error, components) {
          if (error) {
            callback(error);
          } else {
            registry[config.name] = components.slice();
            callback(null, components);
          }
        });
      });
    } else {
      process.nextTick(function() {
        callback(null, registry[config.name].slice());
      });
    }
  } catch (error) {
    process.nextTick(function() {
      callback(error);
    });
  }
};

function sortDependencies(tree) {
  var visited = {},
      sorted = [];

  function visit(name) {
    if (!visited.hasOwnProperty(name)) {
      visited[name] = true;
      if (!tree.hasOwnProperty(name)) {
        throw new Error('Missing dependency: ' + name);
      }
      if (tree[name].hasOwnProperty('dependencies')) {
        Object.keys(tree[name].dependencies).forEach(visit);
      }
      sorted.push(name);
    }
  }

  Object.keys(tree).forEach(visit);
  return sorted;
}
