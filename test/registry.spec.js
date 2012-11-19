var assert = require('assert');
var path = require('path');
var registry = require('../lib/registry');

describe('registry', function() {

  describe('#getPackages()', function() {

    it('should order packages based on dependencies', function(done) {

      registry.getPackages(path.join(__dirname, 'assets', 'app')).

          then(function(packages) {
            // got all packages
            assert.equal(packages.length, 4);

            // app is last
            assert.equal(packages[3].json.name, 'app');

            // clamp is penultimate
            assert.equal(packages[2].json.name, 'clamp');

            // min/max are first two
            var names = packages.slice(0, 2).map(function(pkg) {
              return pkg.json.name;
            });
            assert.deepEqual(names.sort(), ['max', 'min']);

            // first should never have dependencies (circular deps notwithstanding)
            assert.deepEqual(Object.keys(packages[0].dependencies), [], 'no deps');

            done();
          }).

          fail(done);

    });

    it('should allow errors to be handled', function(done) {

      registry.getPackages('bogus-path').

          then(function(packages) {
            done(new Error('Treated a bogus path as a valid package'));
          }).

          fail(function(error) {
            done();
          });

    });

  });

});


