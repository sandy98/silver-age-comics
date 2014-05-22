template = require './templates/home'

module.exports = class HomeView extends Backbone.Marionette.ItemView
	id: 'home-view'
	template: template

	initialize: =>
    show_home_img = ->
      #$('#home-img').attr('src', '/legionthumb?' + new Date().getTime())
      $.get('/legionthumb', (file) ->
        $('#home-img').attr('src', "/zoompage?zoom=16&page=0&at=/#{file}")
        $('#random-link').attr('href', "/#reader/#{file.replace(/\//g, '_')}/0/70"))

    show_home_img()

    @refresh_img_timer = setInterval(show_home_img, 10000)


	                         
	onBeforeClose: =>
	  clearInterval @refresh_img_timer
	  true

#reader/_Adventure Comics_Adventure Comics v1 032-503 after New Adventure Comics 31 (1938-1983)_301-400_Adventure Comics v1 302.cbr/0/70