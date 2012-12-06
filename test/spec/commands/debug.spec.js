var assert = require('assert');
var path = require('path');
var http = require('http');

var tmp = require('tmp');
var wrench = require('wrench');
var bower = require('bower');

var debug = require('../../../lib/commands/debug');
var pkg = require('../../../lib/package');

var PORT = process.env.PORT || 3000;

describe('debug', function() {

  var assets = path.join(__dirname, '..', '..', 'assets'),
      cwd = process.cwd(),
      scratch, app, main;

  before(function(done) {
    tmp.dir(function(error, tmpPath) {
      scratch = tmpPath;
      if (error) {
        done(error);
      }
      wrench.copyDirSyncRecursive(assets, scratch);
      app = path.join(scratch, 'app');
      main = pkg.getMainScript(require(path.join(app, bower.config.json))),
      process.chdir(app);
      bower.commands.install([]).
          on('error', done).
          on('end', function() {
            process.chdir(cwd);
            done();
          });
    });
  });

  after(function() {
    wrench.rmdirSyncRecursive(scratch);
  });

  describe('#action()', function(done) {

    var server;
    beforeEach(function(done) {
      server = debug.action({port: PORT, directory: app}).on('listening', done);
    });

    afterEach(function(done) {
       server.close(done);
    });

    function url(parts) {
      parts = Array.prototype.join.call(arguments, '/');
      return 'http://localhost:' + PORT + '/' + parts;
    }

    function body(response, callback) {
      var parts = [];
      response.setEncoding('utf8');
      response.on('data', parts.push.bind(parts));
      response.on('end', function() {
        callback(parts.join(''));
      });
    }

    it('starts up a server', function() {
      assert.ok(server instanceof http.Server);
      assert.equal(server.address().port, PORT);
    });

    it('provides a loader at the app main path', function(done) {
      http.get(url(main), function(response) {
        assert.equal(response.statusCode, 200);
        body(response, function(content) {
          // TODO: check content
          assert.ok(content.length > 100);
          done();
        })
      }).on('error', done);

    });

  });

});
