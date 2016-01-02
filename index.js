var fs = require('fs');
var path = require('path');
var showdown = require('showdown');
var cheerio = require('cheerio');
var rand = require('generate-key');

function fileExtensionForLanguage(language) {
  switch(language) {
    case 'javascript':
      return '.js';
    case 'ruby':
      return '.rb';
    case 'json':
      return '.json';
  }
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
          return {
            filename: outputFilename,
            content: $(elem).text()
          };
        });
        fulfull(codeBlocks);
      }
    });
  });
}

module.exports = {run: run};
