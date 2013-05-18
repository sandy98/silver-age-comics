#app = require 'application' #Blows the stack!

class Item extends Backbone.Model

    urlRoot: =>
      "item?at=#{@get 'path'}"

    defaults:
      name: ''
      path: ''
      type: 'directory'
      
    isDirectory: =>
      @get('type') is 'directory'
        
    isComic: =>
      (@get('type') is 'rarfile') or (@get('type') is 'zipfile')
        

    toJSON: =>
      base = _.clone @attributes
      base.isDirectory = @isDirectory()
      base.isComic = @isComic()
      
      base

module.exports = Item
