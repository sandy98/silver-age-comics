template = require './templates/contents_main'
Item = require 'models/item'
Items = require 'models/items'
ItemListView = require 'views/ItemListView'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.CompositeView
  template: template

  itemViewContainer: "#dir-list"

  itemView: ItemListView

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
