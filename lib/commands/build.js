var fs = require('fs'),
    path = require('path'),
    Emitter = require('events').EventEmitter,
    wrench = require('wrench'),
    uglify = require('uglify-js'),
    log = require('npmlog'),
    pkg = require('../package');

exports.description = 'build component scripts';

exports.options = [
  ['-M, --no-mangle', 'supress symbol renaming']
];

exports.action = function(options) {
  if (options && options.parent) {
    log.level = options.parent.loglevel;
  }
  if (arguments.length > 1) {
    arguments[arguments.length - 1].help();
  }
  options || (options = {});
  var emitter = new Emitter();
  var dir = options.dir || process.cwd();
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
    log.info('packa', 'building %d sources', scripts.length);
    var sources = scripts.map(function(script) {
      log.verbose('packa', 'reading: %s', script);
      return fs.readFileSync(script, 'utf8');
    });
    var built = uglify(sources.join(';\n'),
        {mangle_options: {mangle: options.mangle}});
    fs.writeFileSync(main, built, 'utf8');
    log.info('packa', 'built %s', main);
    emitter.emit('end');
  });
  return emitter;
};

