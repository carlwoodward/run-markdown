var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var showdown = require('showdown');
var cheerio = require('cheerio');
var rand = require('generate-key');
var fsExtra = require('fs-extra');

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

function buildFilename(filepath, elem, $) {
  var outputFilename;
  var nodeAfterPre = elem.parentNode.nextSibling.nextSibling;
  var isSpecifyingFilename =
    nodeAfterPre.tagName.toLowerCase() === 'blockquote';
  if (isSpecifyingFilename) {
    outputFilename = $(nodeAfterPre).text().trim()
  } else {
    outputFilename = path.basename(filepath);
    var language = $(elem).attr('class').split(' ')[0];
    var extension = path.extname(outputFilename);
    var languageExtension = fileExtensionForLanguage(language);
    outputFilename = outputFilename.replace(
        extension,
        '-' + rand.generateKey(7) + languageExtension);
  }
  return outputFilename;
}

//
// Returns a list of code blocks that look like:
// [{filename: '...', content: '...', language: '...'}, ...]
//
function extractCodeBlocks(filepath) {
  return new Promise(function(fulfull, reject) {
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
        fulfull(codeBlocks);
      }
    });
  });
}

//
// Returns the same list of code blocks
// as what is passed in, but each filename includes
// the directory where it is stored.
//
function writeCodeBlocks(codeBlocks) {
  return new Promise(function(fulfull, reject) {
    var dir = '.runnable-markdown-' + rand.generateKey(7);
    fs.mkdir(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        codeBlocks.forEach(function(codeBlock, index) {
          var filepath = dir + '/' + codeBlock.filename;
          fs.writeFile(filepath, codeBlock.content, function(err) {
            if (err) {
              console.err(err);
              return reject(err);
            } else {
              codeBlock.filename = filepath;
              // TODO: convert to a promise for codeblock and promise.all.
              if (index === codeBlocks.length - 1) {
                fulfull(codeBlocks);
              }
            }
          });
        });
      }
    });
  });
}

function runner(codeBlock) {
  if (codeBlock.filename.indexOf('package.json') !== -1) {
    return 'npm install';
  } else if (codeBlock.filename.indexOf('Gemfile') !== -1) {
    return 'bundle install';
  } else if (codeBlock.language === 'javascript') {
    return 'node';
  } else {
    return codeBlock.language;
  }
}

//
// Runs all code blocks sequentially.
// Uses specially runners for files like Gemfile and package.json.
// Also cleans up directory.
// Returns codeBlocks.
//
function runCodeBlocks(codeBlocks) {
  if (codeBlocks.length === 0) {
    return Promise.resolve(codeBlocks);
  }
  return new Promise(function(fulfull, reject) {
    var dir = path.dirname(codeBlocks[0].filename);
    codeBlocks.forEach(function(codeBlock, index) {
      var filenameWithoutDir = codeBlock.filename.replace(dir + '/', '');
      var command = runner(codeBlock) + ' ' + filenameWithoutDir;
      exec(command, {cwd: dir}, function(error, stdout, stderr) {
        if (error) {
          reject(error);
        } else {
          console.log(stdout);
          console.error(stderr);

          // TODO: convert to a promise for codeblock and promise.all.
          if (index === codeBlocks.length - 1) {
            fsExtra.remove(dir, function(err) {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                fulfull(codeBlocks);
              }
            });
          }
        }
      });
    });
  });
}

module.exports = {
  extractCodeBlocks: extractCodeBlocks,
  writeCodeBlocks: writeCodeBlocks,
  runCodeBlocks: runCodeBlocks
};
