var fs = require('fs'),
    path = require('path'),
    Emitter = require('events').EventEmitter,
    wrench = require('wrench'),
    uglify = require('uglify-js'),
    pkg = require('../package');

exports.description = 'build component scripts';

exports.action = function(options) {
  var emitter = new Emitter();
  // TODO: real options handling
  options = options || {};
  var dir = options.dir || process.cwd();
  // TODO: logging
  var silent = (options.verbose === false);
  pkg.getComponents(dir, function(error, components) {
    if (error) {
      emitter.emit('error', error);
      throw new Error(error);
    }
    var main = pkg.getMainScript(components[components.length - 1]);
    try {
      wrench.mkdirSyncRecursive(path.dirname(main));
    } catch (error) {
      emitter.emit('error', error);
      throw new Error(error);
    }
    var scripts = [];
    components.forEach(function(component) {
      scripts = scripts.concat(component.scripts);
    });
    if (!silent) {
      console.log('building %d sources', scripts.length);
    }
    var sources = scripts.map(function(script) {
      return fs.readFileSync(script, 'utf8');
    });
    var built = uglify(sources.join('\n'));
    fs.writeFileSync(main, built, 'utf8');
    if (!silent) {
      console.log('built %s', main);
    }
    emitter.emit('end');
  });
  return emitter;
};

