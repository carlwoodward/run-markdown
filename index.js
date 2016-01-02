var fs = require('fs');
var path = require('path');
var showdown = require('showdown');
var cheerio = require('cheerio');
var rand = require('generate-key');

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
  if (nodeAfterPre.tagName.toLowerCase() === 'blockquote') {
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

function run(filepath) {
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
            content: $(elem).text()
          };
        });
        fulfull(codeBlocks);
      }
    });
  });
}

module.exports = {run: run};
