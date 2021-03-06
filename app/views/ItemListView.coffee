template = require './templates/itemlist'
app = require 'application'

module.exports = class ItemListView extends Backbone.Marionette.ItemView
  template: template

  tagName: 'li'

  className: 'span2'

  events:
    'click': 'onClick'

  initialize: =>
    @$el.on 'load error', 'img', @onThumb
    
  onThumb: =>
    console.log "Thumb loaded"
    app.vent.trigger "thumb:loaded"
    
  onClick: (evt) =>
    evt.preventDefault?()
    ###
    @model.fetch
      success: (model, response) =>
        #console.log "Item #{model.get 'name'} successfully retrieved"
        if model.get('type') in ['rarfile', 'zipfile']
          model.set('currentPage', 0)
          app.vent.trigger "comics:selected", model
        else
          #console.log "Triggering 'item:selected' with params item.name = #{model.get 'name'} and item.path = #{model.get 'path'}"
          app.vent.trigger "item:selected", model
      error: =>
        bootbox.alert "Warning. Server is not responding, probably down. ;-("
    ###
    #bootbox.alert "Clicked on a #{@model.get('type')} type item." 
    if @model.get('type') in ['rarfile', 'zipfile']
      @model.set('currentPage', 0)
      app.libraryPath = location.href
      app.vent.trigger "comics:selected", @model
      #bootbox.alert "Clicked on a comics file"
    else
      app.vent.trigger "item:selected", @model
      #bootbox.alert "Clicked on a directory"
    false