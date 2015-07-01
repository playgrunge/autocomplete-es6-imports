var Range = require('atom').Range;
var _ = require('underscore-plus');
var fuzzaldrin = require('fuzzaldrin');
var path = require('path');
var fs = require('fs');

module.exports = {
  selector: '.source.js, .source.jsx',
  getSuggestions: function(arg) {
    var bufferPosition, editor, prefix, suggestions;
    editor = arg.editor, bufferPosition = arg.bufferPosition;
    prefix = this.getPrefix(editor, bufferPosition);
    if (prefix != undefined) {
      suggestions = this.findSuggestionsForPrefix(editor, prefix);
      return new Promise(function(resolve) {
        return resolve(suggestions);
      });
    }
  },
  getPrefix: function(editor, bufferPosition) {
    var line, ref, regex;
    regex = /^import[ ].*[ ]from[ ](.*)$/;
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    return (ref = line.match(regex)) != null ? ref[1] : void 0;
  },
  findSuggestionsForPrefix: function(editor, prefix) {
    var basePath, directory, e, editorPath, files, prefixPath, result, resultPath, results, rightLabel, stat, suggestion, suggestions;
    editorPath = editor != null ? editor.getPath() : void 0;
    basePath = path.dirname(editorPath);
    prefixPath = path.resolve(basePath, prefix);
    if (prefix.endsWith('/')) {
      directory = prefixPath;
      prefix = '';
    } else {
      if (basePath === prefixPath) {
        directory = prefixPath;
      } else {
        directory = path.dirname(prefixPath);
      }
      prefix = path.basename(prefix);
    }
    try {
      stat = fs.statSync(basePath);
      if (!stat.isDirectory()) {
        return [];
      }
    } catch (_error) {
      e = _error;
      return [];
    }
    while(files === undefined || _.contains(files, "package.json")){
      try {
        files = fs.readdirSync(prefixPath);
      } catch (_error) {
        e = _error;
        return [];
      }
      prefixPath = path.resolve(prefixPath+".tmp", prefix);
    }
    results = fuzzaldrin.filter(files, prefix);
    suggestions = (function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = results.length; i < len; i++) {
        result = results[i];
        resultPath = path.resolve(directory, result);
        try {
          stat = fs.statSync(resultPath);
        } catch (_error) {
          e = _error;
          continue;
        }
        if (stat.isDirectory()) {
          rightLabel = 'Dir';
          result += path.sep;
          continue;
        } else if (stat.isFile()) {
          rightLabel = 'File';
        } else {
          continue;
        }
        suggestion = {
          text: result,
          replacementPrefix: prefix,
          rightLabel: rightLabel,
          data: {
            body: result
          }
        };
        if (suggestion.rightLabel !== 'File') {
          suggestion.onDidInsertSuggestion = function() {
            return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
          };
        }
        results1.push(suggestion);
      }
      return results1;
    })();
    return suggestions;
  }
};
