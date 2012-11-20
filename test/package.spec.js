var assert = require('assert');
var path = require('path');
var pkg = require('../lib/package');
var tmp = require('tmp');
var wrench = require('wrench');
var bower = require('bower');

describe('package', function() {

  describe('#getComponents()', function() {

    var assets = path.join(__dirname, 'assets'),
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
              done();
            });
      });
    });

    after(function() {
      wrench.rmdirSyncRecursive(scratch);
    });

    it('should order components based on dependencies', function(done) {

      pkg.getComponents(app).

          then(function(components) {
            // got all components
            assert.equal(components.length, 4);

            // app is last
            assert.equal(components[3].name, 'app');

            // clamp is penultimate
            assert.equal(components[2].name, 'clamp');

            // min/max are first two
            var names = components.slice(0, 2).map(function(component) {
              return component.name;
            });
            assert.deepEqual(names.sort(), ['max', 'min']);

            // first should never have dependencies (circular deps notwithstanding)
            assert.deepEqual(Object.keys(components[0].dependencies || {}), [], 'no deps');

            done();
          }).

          fail(done);

    });

    it('should allow errors to be handled', function(done) {

      pkg.getComponents('bogus-path').

          then(function(packages) {
            done(new Error('Treated a bogus path as a valid package'));
          }).

          fail(function(error) {
            done();
          });

    });

  });

});


