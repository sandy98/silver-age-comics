template = require './templates/footer'
app = require 'application'

class FooterView extends Backbone.Marionette.ItemView
	#template: template

  initialize: =>
    #_.bindAll(@)

  onRender: (evt) =>
    app.getVisitors  (visitors) ->
      @$("#visitor-number").text "Visitor Number #{visitors}"

  template: template

module.exports = FooterView

