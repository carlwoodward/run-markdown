var assert = require('assert');
var main = require('../index');

describe('#run()', function() {
  it('loads a file', function(done) {
    main.run('./test/test-markdown.md')
      .then(function(codeBlocks) {
        assert.equal(codeBlocks.length, 5);
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });
});
