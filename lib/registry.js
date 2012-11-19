var Package = require('bower/lib/core/package');
var Q = require('q');

var registry = {};

exports.getPackages = function(path) {
  var deferred = Q.defer();

  if (!registry.hasOwnProperty(path)) {
    registry[path] = new Package(path, path);
  }

  var pkg = registry[path];
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

  return deferred.promise;
};

function getDependencyMap(dependencies) {
  var map = {};

  function lookup(deps) {
    deps.forEach(function(dep) {
      var name = dep.name;
      if (!map.hasOwnProperty(name)) {
        var names = Object.keys(dep.dependencies);
        map[name] = {
          pkg: dep,
          dependencies: names
        };
        lookup(names.map(function(name) {return dep.dependencies[name];}));
      }
    });

  }

  lookup(dependencies);
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
