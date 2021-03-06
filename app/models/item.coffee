utils = require '../lib/utils'

module.exports = class Item extends Backbone.Model

    urlRoot: =>
      "item?at=#{@get 'path'}"

    defaults:
      name: ''
      path: ''
      type: 'directory'
      currentPage: 0
      
    isDirectory: =>
      @get('type') is 'directory'
        
    isComic: =>
      (@get('type') is 'rarfile') or (@get('type') is 'zipfile')
        
    splitNames: =>
      #'splitNames'
      @get('path').split '/'

    breadcrumbs: =>
      #'breadcrumbs'
      utils.breadcrumbs(@splitNames()).map((arr) -> arr.join('/'))

    hideExtension: =>
      @get('name').replace('.cbr', '').replace('.cbz', '')

    pageNumbers: =>
      pages = @get('pages')
      return [] unless pages
      (shown: n, real: n - 1 for n in [1..pages.length])

    toJSON: =>
      base = _.clone @attributes
      base.isDirectory = @isDirectory()
      base.isComic = @isComic()
      base.ancestryNames = @splitNames()
      base.ancestryPaths = @breadcrumbs()
      base.ancestryObjs = (name: base.ancestryNames[n], path: base.ancestryPaths[n] for n in [0..(base.ancestryNames.length - 1)])
      base.bareName = @hideExtension()
      base.pageNumbers = @pageNumbers()
      base

