template = require './templates/itemlist'
app = require 'application'

module.exports = class ItemListView extends Backbone.Marionette.ItemView
  template: template

  tagName: 'li'

  className: 'span2'

  events:
    'click': 'onClick'

  onClick: (evt) =>
    @model.fetch
      success: (model, response) =>
        console.log "Item #{model.get 'name'} successfully retrieved"
        if model.get('type') in ['rarfile', 'zipfile']
          model.set('currentPage', 0)
          app.vent.trigger "comics:selected", model
        else
          app.vent.trigger "item:selected", model
      error: =>
        bootbox.alert "Warning. Server is not responding, probably down. ;-("