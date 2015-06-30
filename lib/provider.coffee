{Range}  = require('atom')
fuzzaldrin = require('fuzzaldrin')
path = require('path')
fs = require('fs')

module.exports =
  selector: '.source.js, .source.jsx'

  getSuggestions: ({editor, bufferPosition}) ->
    prefix = @getPrefix(editor, bufferPosition)
    if prefix
      suggestions = @findSuggestionsForPrefix(editor, prefix)
      new Promise (resolve) ->
        resolve(suggestions)

  getPrefix: (editor, bufferPosition) ->
    # Whatever your prefix regex might be
    regex = /^import[ ].*[ ]from[ ](.*)$/

    # Get the text for the line up to the triggered buffer position
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])

    # Match the regex to the line, and return the match
    line.match(regex)?[1]

  findSuggestionsForPrefix: (editor, prefix) ->
    editorPath = editor?.getPath()
    basePath = path.dirname(editorPath)

    prefixPath = path.resolve(basePath, prefix)

    if prefix.endsWith('/')
      directory = prefixPath
      prefix = ''
    else
      if basePath is prefixPath
        directory = prefixPath
      else
        directory = path.dirname(prefixPath)
      prefix = path.basename(prefix)

    # Is this actually a directory?
    try
      stat = fs.statSync(directory)
      return [] unless stat.isDirectory()
    catch e
      return []

    # Get files
    try
      files = fs.readdirSync(directory)
    catch e
      return []
    results = fuzzaldrin.filter(files, prefix)

    suggestions = for result in results
      resultPath = path.resolve(directory, result)

      # Check for type
      try
        stat = fs.statSync(resultPath)
      catch e
        continue
      if stat.isDirectory()
        label = 'Dir'
        result += path.sep
      else if stat.isFile()
        label = 'File'
      else
        continue

      suggestion =
        word: result
        prefix: prefix
        label: label
        data:
          body: result
      if suggestion.label isnt 'File'
        suggestion.onDidConfirm = ->
          atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate')

      suggestion
    return suggestions
