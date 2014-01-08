template = require './templates/home'

module.exports = class HomeView extends Backbone.Marionette.ItemView
	id: 'home-view'
	template: template

	initialize: =>
	  @refresh_img_timer = setInterval(
	                         ->
	                           $('img.img-polaroid').attr('src', '/legionthumb?' + new Date().getTime())
	                         , 1000)
	                         
	                         