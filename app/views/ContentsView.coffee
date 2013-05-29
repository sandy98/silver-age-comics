template = require './templates/contents'
app = require 'application'
ContentsBCView = require './ContentsBCView'
ContentsMainView = require './ContentsMainView'
ComicsReaderView = require './ComicsReaderView'

module.exports = class ContentsView extends Backbone.Marionette.Layout
  template: template

  regions:
    breadcrumbs: '#contents-bc'
    main: '#contents-main'
    comics_reader: '#comics-popup'

  initialize: =>
    @item = app.item
    @bcView = new ContentsBCView @item
    @mainView = new ContentsMainView @item
    @readerView = null
    self = @
    @nickName = "ContentsView"
    app.vent.on 'comics:selected', (item) =>
      console.log "#{@nickName}, constructed by #{@constructor.name} responding to app.vent-comics:selected"
      location = "reader.html?page=0&at=#{item.get('path')}&pages=#{item.get('pages').length}"
      if @mainView.optExternalReader
        window.popup = window.open(location, item.get('name'), 'location=0, directories=0, status=0, menubar=0, resizable=0')
        popup.requestFullScreen?()
      else
        console.log "Creating a new ComicsReaderView"
        self.readerView = new ComicsReaderView model: item
        console.log "Now to show the recently created ComicsReaderView"
        try
          self.comics_reader.show self.readerView
          console.log "ComicsReaderView should be shown by now..."
        catch e
          console.log e.toString()
          self.readerView.render()

  onRender: (evt) =>
    @breadcrumbs.show @bcView
    @main.show @mainView

