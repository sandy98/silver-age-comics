template = require './templates/home'

module.exports = class HomeView extends Backbone.Marionette.ItemView
	id: 'home-view'
	template: template

	initialize: =>
	  @refresh_img_timer = setInterval(
	                         ->
	                           $('#home-img').attr('src', '/legionthumb?' + new Date().getTime())
	                         , 10000)
	                         
	                         