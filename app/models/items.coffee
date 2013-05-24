# Base class for all collections.
Item = require 'models/item'

module.exports = class Items extends Backbone.Collection

  model: Item

  firstPage: 0
  currentPage: 0
  perPage: 5

	
  toJSON: =>
    start = @currentPage * @perPage
    end = start + @perPage
    @models.slice(start, end)

  parse: =>
    new Backbone.Collection @toJSON()

  maxPage: =>
    Math.floor(@models.length / @perPage)