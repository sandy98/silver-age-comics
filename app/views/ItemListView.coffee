template = require './templates/itemlist'
app = require 'application'

module.exports = class ItemListView extends Backbone.Marionette.ItemView
	template: template
	
	tagName: 'li'
	
	events:
	 'click': 'onClick'
	 
	 
	onClick: (evt) =>
          @model.fetch()
          #bootbox.alert "Going to #{@model.get('path')}"
          app.vent.trigger "item:selected", @model