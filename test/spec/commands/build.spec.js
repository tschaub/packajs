var assert = require('assert');
var fs = require('fs');
var path = require('path');

var tmp = require('tmp');
var wrench = require('wrench');
var bower = require('bower');

var pkg = require('../../../lib/package');
var build = require('../../../lib/commands/build');

describe('build', function() {

  describe('#action()', function() {

    var assets = path.join(__dirname, '..', '..', 'assets'),
        cwd = process.cwd(),
        scratch, app, main;

    beforeEach(function(done) {
      tmp.dir(function(error, tmpPath) {
        scratch = tmpPath;
        if (error) {
          return done(error);
        }
        wrench.copyDirSyncRecursive(assets, path.join(scratch, 'assets'));
        app = path.join(scratch, 'assets', 'app');
        process.chdir(app);
        bower.commands.install([])
            .on('error', function(error) {
              process.chdir(cwd);
              done(error);
            })
            .on('end', function() {
              process.chdir(cwd);
              pkg.getComponents(app, function(error, components) {
                if (error) {
                  done(error);
                } else {
                  main = pkg.getMainScript(components[components.length - 1]);
                  done();
                }
              });
            });
      });
    });

    afterEach(function() {
      wrench.rmdirSyncRecursive(scratch);
    });

    it('concatenates and minifies sources', function(done) {
      assert.ok(!fs.existsSync(main), 'main does not exist before build');

      var emitter = build.action({
        directory: app, parent: {loglevel: 'error'}
      });
      emitter.on('error', done);
      emitter.on('end', function() {
        assert.ok(fs.existsSync(main), 'main exists after build');
        done();
      });
    });

    it('accepts an alternate target directory', function(done) {
      var target = path.join(scratch, 'target', 'app');
      var emitter = build.action({
        directory: app, parent: {loglevel: 'error'}, target: target
      });
      emitter.on('error', done);
      emitter.on('end', function() {
        var targetMain = path.join(target, path.relative(app, main));
        assert.ok(!fs.existsSync(main), 'main does not exist relative to app');
        assert.ok(fs.existsSync(targetMain), 'main exists in target dir');
        done();
      });
    });

  });

});


