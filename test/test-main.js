var assert = require('assert');
var main = require('../index');

describe('#extractCodeBlocks()', function() {
  it('loads a file and extracts code blocks', function(done) {
    main.extractCodeBlocks('./test/test-markdown.md')
      .then(function(codeBlocks) {
        assert.equal(codeBlocks.length, 5);
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });
});
