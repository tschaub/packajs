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

var getMainScript = exports.getMainScript = function(component) {
  var main = component.main;
  if (main) {
    if (util.isArray(main)) {
      main = main.reduce(function(prev, cur) {return isJS(cur) ? cur : prev;}, null);
    }
    main = path.normalize(main);
    if ((/^[\/\.]/).test(main)) {
      throw new Error('The main JavaScript must be a relative path witin the app directory');
    }
    // TODO: decide if component.json should have non-js main (e.g. rickshaw)
    if (!isJS(main)) {
      main += ".js";
    }
  }
  return path.join(component.dir, main);
}

function getComponentScripts(component, callback) {
  var main;
  try {
    main = getMainScript(component);
  } catch (error) {
    return callback(error);
  }
  if (main && !component.hasOwnProperty('scripts')) {
    component.scripts = [main];
    process.nextTick(function() {
      callback(null, component);
    });
  } else if (component.scripts) {
    if (util.isArray(component.scripts)) {
      component.scripts = component.scripts.map(function(script) {
        return path.join(component.dir, script);
      });
      process.nextTick(function() {
        callback(null, component);
      });
    } else {
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
    }
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
    var appConfig = require(path.join(dir, json));
    var overrides = appConfig.pk && appConfig.ok.components || {};
    appConfig.dir = dir;
    if (!registry.hasOwnProperty(appConfig.name)) {
      var emitter = bower.commands.list({map: true});
      emitter.on('error', callback);
      emitter.on('data', function(tree) {
        // add any dependencies that may not be present in original config
        for (var name in tree) {
          if (overrides[name] && overrides[name].dependencies) {
            tree[name].dependencies = overrides[name].dependencies;
          }
        }
        var components = sortDependencies(tree).map(function(name) {
          var componentDir = path.join(dir, bower.config.directory, name);
          var componentConfig = require(path.join(componentDir, json));
          componentConfig.dir = componentDir;
          if (overrides.hasOwnProperty(name)) {
            var override = overrides[name];
            for (var key in override) {
              componentConfig[key] = override[key];
            }
          }
          return componentConfig;
        });
        components.push(appConfig);
        getComponentsSources(components, function(error, components) {
          if (error) {
            callback(error);
          } else {
            registry[appConfig.name] = components.slice();
            callback(null, components);
          }
        });
      });
    } else {
      process.nextTick(function() {
        callback(null, registry[appConfig.name].slice());
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
