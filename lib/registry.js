var path = require('path');
var bower = require('bower');
var Package = require('bower/lib/core/package');
var Q = require('q');

var registry = {};

exports.getPackages = function(dir) {

  var deferred = Q.defer();
  try {
    var name = require(path.join(dir, bower.config.json)).name;
    if (!registry.hasOwnProperty(name)) {
      registry[name] = new Package(name, dir);
    }

    var pkg = registry[name];
    pkg.once('resolve', function() {
      var deepDependencies = pkg.getDeepDependencies(),
          dependencyMap = getDependencyMap(deepDependencies);

      try {
        var sorted = sortDependencies(dependencyMap);
        sorted.push(pkg);
        deferred.resolve(sorted);
      } catch (error) {
        deferred.reject(new Error(error));
      }
    });

    pkg.once('error', function(error) {
      deferred.reject(new Error(error));
    });
    pkg.resolve();
  } catch (error) {
    deferred.reject(new Error(error));
  }

  return deferred.promise;
};

function getDependencyMap(packages) {
  var map = {};

  function lookup(packages) {
    packages.forEach(function(pkg) {
      var name = pkg.name;
      if (!map.hasOwnProperty(name)) {
        var names = Object.keys(pkg.dependencies);
        map[name] = {
          pkg: pkg,
          dependencies: names
        };
        lookup(names.map(function(name) {return pkg.dependencies[name];}));
      }
    });

  }

  lookup(packages);
  return map;
}

function sortDependencies(map) {
  var visited = {},
      sorted = [];

  function visit(name) {
    if (!visited.hasOwnProperty(name)) {
      visited[name] = true;
      if (!map.hasOwnProperty(name)) {
        throw new Error('Missing dependency: ' + name);
      }
      map[name].dependencies.forEach(visit);
      sorted.push(map[name].pkg);
    }
  }

  for (var name in map) {
    visit(name);
  }
  return sorted;
}
