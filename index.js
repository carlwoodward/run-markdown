var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var showdown = require('showdown');
var cheerio = require('cheerio');
var rand = require('generate-key');
var fsExtra = require('fs-extra');
var async = require('async');

function fileExtensionForLanguage(language) {
  return {
    javascript: '.js',
    ruby: '.rb',
    json: '.json',
    python: '.py',
    coffeescript: '.coffee',
    go: '.go',
    erlang: '.erl',
    perl: '.pl',
    rust: '.rs'
  }[language] || '.unknown';
}

function generateFilename(filepath, elem, $) {
  var outputFilename = path.basename(filepath);
  var language = $(elem).attr('class').split(' ')[0];
  var extension = path.extname(outputFilename);
  var languageExtension = fileExtensionForLanguage(language);
  outputFilename = outputFilename.replace(
      extension,
      '-' + rand.generateKey(7) + languageExtension);
  return outputFilename;
}

function buildFilename(filepath, elem, $) {
  var outputFilename;
  if (!elem.parentNode.nextSibling) {
    return generateFilename(filepath, elem, $);
  }
  var nodeAfterPre = elem.parentNode.nextSibling.nextSibling;
  var isSpecifyingFilename =
    nodeAfterPre.tagName.toLowerCase() === 'blockquote';
  if (isSpecifyingFilename) {
    outputFilename = $(nodeAfterPre).text().trim()
  } else {
    return generateFilename(filepath, elem, $);
  }
  return outputFilename;
}

//
// Returns a list of code blocks that look like:
// [{filename: '...', content: '...', language: '...'}, ...]
//
function extractCodeBlocks(filepath) {
  return new Promise(function(fulfill, reject) {
    fs.readFile(filepath, 'utf8', function(err, text) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        var converter = new showdown.Converter();
        var html = converter.makeHtml(text);
        var $ = cheerio.load(html);
        var codeBlocks = $('pre code').map(function(index, elem) {
          var language = $(elem).attr('class').split(' ')[0];
          return {
            filename: buildFilename(filepath, elem, $),
            content: $(elem).text(),
            language: language
          };
        });
        fulfill(codeBlocks.toArray());
      }
    });
  });
}

function makeTempDir(dir) {
  return new Promise(function(fulfill, reject) {
    fs.mkdir(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        fulfill();
      }
    });
  });
}

//
// Returns the same list of code blocks
// as what is passed in, but each filename includes
// the directory where it is stored.
//
function writeAndRunCodeBlocks(codeBlocks) {
  var dir = '.runnable-markdown-' + rand.generateKey(7);
  return makeTempDir(dir)
  .then(function() {
    return new Promise(function(fulfill, reject) {
      async.mapSeries(codeBlocks, function(codeBlock, callback) {
        var filepath = dir + '/' + codeBlock.filename;
        fs.appendFile(filepath, codeBlock.content, function(err) {
          if (err) {
            console.err(err);
            callback(err, null);
          } else {
            codeBlock.filename = filepath;
            runCodeBlock(codeBlock)
              .then(function(codeBlock) {
                callback(null, codeBlock);
              })
              .catch(function(err) {
                callback(err, null);
              });
          }
        });
      }, function(err, result) {
        if (err) {
          reject(err);
        } else {
          fulfill(result);
        }
      });
    });
  });
}

function runner(codeBlock, filenameWithoutDir) {
  if (codeBlock.filename.indexOf('package.json') !== -1) {
    return 'npm install';
  } else if (codeBlock.filename.indexOf('Gemfile') !== -1) {
    return 'bundle install';
  } else if (codeBlock.language === 'javascript') {
    return 'node' + ' ' + filenameWithoutDir;
  } else {
    return codeBlock.language + ' ' + filenameWithoutDir;
  }
}

function removeOldDir(dir) {
  return new Promise(function(fulfill, reject) {
    fsExtra.remove(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        fulfill();
      }
    });
  });
}

//
// Runs a code block.
// Uses specially runners for files like Gemfile and package.json.
// Returns codeBlock.
//
function runCodeBlock(codeBlock) {
  var dir = path.dirname(codeBlock.filename);
  return new Promise(function(fulfill, reject) {
    var filenameWithoutDir = codeBlock.filename.replace(dir + '/', '');
    var command = runner(codeBlock, filenameWithoutDir);
    exec(command, {cwd: dir}, function(error, stdout, stderr) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.error(stderr);
        }
        fulfill(codeBlock);
      }
    });
  });
}

module.exports = {
  extractCodeBlocks: extractCodeBlocks,
  writeAndRunCodeBlocks: writeAndRunCodeBlocks
};
