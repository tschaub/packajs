var fs = require('fs');
var path = require('path');
var Emitter = require('events').EventEmitter;

var wrench = require('wrench');
var uglify = require('uglify-js');
var log = require('npmlog');

var pkg = require('../package');


/**
  Command description
  @type {string}
 */
exports.description = 'build component scripts';


/**
  Command options
  @type {Array.<string>}
 */
exports.options = [
  ['-M, --no-mangle', 'supress symbol renaming'],
  ['-d, --directory <path>', 'build app at the given path [.]',
    String, process.cwd()],
  ['-t, --target <path>', 'use the target directory for built resources']
];


/**
  Build action
  @param {Object} options Options for command.
  @return {EventEmitter} Emits 'error' on error and 'end' when action completes.
 */
exports.action = function(options) {
  if (options.parent) {
    log.level = options.parent.loglevel;
  }
  if (arguments.length > 1) {
    arguments[arguments.length - 1].help();
  }
  var emitter = new Emitter();
  var appDir = options.directory;
  pkg.getComponents(appDir, function(error, components) {
    if (error) {
      return emitter.emit('error', error);
    }
    var main = pkg.getMainScript(components[components.length - 1]);
    if (options.target) {
      main = path.join(options.target, path.relative(appDir, main));
    }
    try {
      wrench.mkdirSyncRecursive(path.dirname(main));
    } catch (error) {
      return emitter.emit('error', error);
    }
    var scripts = [],
        error;
    components.every(function(component) {
      if (component.scripts) {
        scripts = scripts.concat(component.scripts);
        return true;
      } else {
        error = 'No scripts for component: ' + component.name;
        return false;
      }
    });
    if (error) {
      return emitter.emit('error', new Error(error));
    }
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
