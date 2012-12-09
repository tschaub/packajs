var assert = require('assert');
var fs = require('fs');
var path = require('path');
var pkg = require('../../../lib/package');
var build = require('../../../lib/commands/build');
var tmp = require('tmp');
var wrench = require('wrench');
var bower = require('bower');

describe('build', function() {

  describe('#action()', function() {

    var assets = path.join(__dirname, '..', '..', 'assets'),
        cwd = process.cwd(),
        scratch, app;

    before(function(done) {
      tmp.dir(function(error, tmpPath) {
        scratch = tmpPath;
        if (error) {
          done(error);
        }
        wrench.copyDirSyncRecursive(assets, scratch);
        app = path.join(scratch, 'app');
        process.chdir(app);
        bower.commands.install([]).
            on('error', done).
            on('end', function() {
              process.chdir(cwd);
              console.log('tmp app dir: %s', tmpPath);
              done();
            });
      });
    });

    after(function() {
      wrench.rmdirSyncRecursive(scratch);
    });

    it('concatenates and minifies sources', function(done) {
      var config = require(path.join(app, bower.config.json));
      var main = pkg.getMainScript(config);

      assert.ok(!fs.existsSync(main), 'main does not exist before build');

      var emitter = build.action({dir: app, parent: {loglevel: 'error'}});
      emitter.on('error', done);
      emitter.on('end', function() {
        assert.ok(fs.existsSync(main), 'main exists after build');
        done();
      });
    });

  });

});


