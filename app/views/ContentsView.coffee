template = require './templates/contents'
app = require 'application'
ContentsBCView = require './ContentsBCView'
ContentsMainView = require './ContentsMainView'
ComicsReaderView = require './ComicsReaderView'

module.exports = class ContentsView extends Backbone.Marionette.Layout
  template: template

  initialize: =>
    @item = app.item
    @bcView = new ContentsBCView @item
    @mainView = new ContentsMainView @item
    app.vent.on 'comics:selected', (item) =>
      @readerView = new ComicsReaderView model: item
      @comics_reader.show @readerView

  onRender: (evt) =>
    @breadcrumbs.show @bcView
    @main.show @mainView

  regions:
    breadcrumbs: '#contents-bc'
    main: '#contents-main'
    comics_reader: '#comics-popup'