var path = require('path');
var bower = require('bower');
var Q = require('q');

var registry = {};

exports.getComponents = function(dir) {
  var deferred = Q.defer();

  try {
    process.chdir(dir);
    var json = bower.config.json;
    var config = require(path.join(dir, json));
    if (!registry.hasOwnProperty(config.name)) {
      bower.commands.list({map: true}).
          on('error', function(error) {
            deferred.reject(new Error(error));
          }).
          on('data', function(tree) {
            var components = sortDependencies(tree).map(function(name) {
              return require(path.join(dir, bower.config.directory, name, json));
            });
            components.push(config);
            registry[config.name] = components.slice();
            deferred.resolve(components);
          });
    } else {
      deferred.resolve(registry[config.name].slice());
    }
  } catch (error) {
    deferred.reject(new Error(error));
  }

  return deferred.promise;
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
