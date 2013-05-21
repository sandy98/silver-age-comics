template = require './templates/contents_bc'
Item = require 'models/item'
Items = require 'models/items'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.ItemView
  template: template

  initialize: =>
    app.vent.on 'item:selected', (item) =>
      app.item = item
      @reload()

    @reload()

  reload: =>
    @model = app.item
    @model.on 'all change', @loadItems
    @model.fetch()


  loadItems: (evt) =>
    @collection = new Items @model.get 'files'
    @render()
