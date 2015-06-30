provider = require './provider'

module.exports =
  activate: ->

  getProvider: -> provider

  provide: ->
    return {provider: @getProvider()}
