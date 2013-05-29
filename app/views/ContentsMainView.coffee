template = require './templates/contents_main'
Item = require 'models/item'
Items = require 'models/items'
ItemListView = require 'views/ItemListView'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.CompositeView
  template: template

  itemViewContainer: "#dir-list"

  itemView: ItemListView

  optExternalReader: true

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
    @$('#opt-external-reader').parent().tooltip placement: 'top'
    @$('.btn').on 'click', @onNavigate
    @$('#opt-external-reader').on 'change', =>
      @optExternalReader = if @$('#opt-external-reader').is(':checked') then true else false
      console.log "External reader:", @optExternalReader
    start = @fullCollection.currentPage * @fullCollection.perPage + 1
    end = start + @fullCollection.perPage - 1
    total = @fullCollection.length
    if end > total
      end = total
    console.log start, end, total
    @$('#page-status').text "#{start} - #{end} of #{total}"
    if @optExternalReader
      @$('#opt-external-reader').attr 'checked', 'checked'

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
    max = @fullCollection.maxPage()
    if page > max
      page = max

    return if page is @fullCollection.currentPage
    @fullCollection.currentPage = page
    @collection = @fullCollection.parse()
    @render()
