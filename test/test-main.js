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

describe('#writeCodeBlocks()', function() {
  it('writes a directory with all files', function(done) {
    main.writeCodeBlocks([{
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

describe('#runCodeBlocks()', function() {
  it('run a list of code blocks', function(done) {
    main.writeCodeBlocks([{
      filename: 'hello.js',
      content: 'console.log("test");',
      language: 'javascript'
    }])
    .then(main.runCodeBlocks)
    .then(function(codeBlocks) {
      assert.equal(codeBlocks.length, 1);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });
});
