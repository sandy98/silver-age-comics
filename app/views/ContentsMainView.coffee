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
    @model.on 'all', @loadItems
    @model.fetch()


  loadItems: (evt) =>
    @fullCollection = new Items @model.get 'files'
    @collection = @fullCollection.parse()
    @render()

  onRender: =>
    @$('.btn').on 'click', @onNavigate

  onNavigate: (evt) =>
    @[$(evt.target).attr("data-nav")]()

  first: =>
    @goto 0

  last: =>
    @goto @fullCollection.maxPage()

  prev: =>
    @goto @fullCollection.currentPage - 1

  next: =>
    @goto @fullCollection.currentPage + 1

  goto: (page) =>
    if page < 0
      page = 0
    if page > @fullCollection.maxPage()
      page = @fullCollection.maxPage()

    @fullCollection.currentPage = page
    @collection = @fullCollection.parse()
    @render()
