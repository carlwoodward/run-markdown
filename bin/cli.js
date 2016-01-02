#!/usr/bin/env node

var process = require('process');
var main = require('../index');

main.extractCodeBlocks(process.argv[2])
  .then(main.writeAndRunCodeBlocks)
  .then(function() {
    console.log('run-markdown complete.');
  })
  .catch(function(err) {
    console.error(err);
    console.error(err.stack);
  });
