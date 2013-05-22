template = require './templates/itemlist'
app = require 'application'

module.exports = class ItemListView extends Backbone.Marionette.ItemView
	template: template
	
	tagName: 'li'
	
	events:
	 'click': 'onClick'
	 
	 
	onClick: (evt) =>
          @model.fetch
            success: (model, response) =>
              console.log "Item #{model.get 'name'} successfully retrieved"
              app.vent.trigger "item:selected", model