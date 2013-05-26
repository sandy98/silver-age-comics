template = require './templates/contents_bc'
Item = require 'models/item'
Items = require 'models/items'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.ItemView
  template: template

  initialize: =>
    app.vent.on 'item:selected', (item) =>
      @model = item
      @render()

    @reload()

  reload: =>
    @model = app.item
    @model.on 'all', @render
    @model.fetch()

  events:
    'click a': 'onClick'

  onClick: (evt) =>
    evt.preventDefault?()
    console.log "Clicked on #{$(evt.target).attr('data-path')}"
    @model = new Item path: $(evt.target).attr('data-path')
    @model.fetch
      success: (model, response) =>
        app.vent.trigger "item:selected", model
      error: =>
        bootbox.alert "Warning: server is not responding."
    false


  onRender: (evt) =>
    @$('li:last').addClass('active')
    @$('span.divider:last').remove()