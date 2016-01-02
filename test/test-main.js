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

describe('#writeAndRunCodeBlocks()', function() {
  it('writes a directory with all files and runs them', function(done) {
    main.writeAndRunCodeBlocks([{
      filename: 'hello.js',
      content: 'console.log("test");',
      language: 'javascript'
    }])
    .then(function(codeBlocks) {
      assert.equal(codeBlocks.length, 1);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });
});
