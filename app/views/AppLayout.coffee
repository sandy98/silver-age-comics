application = require 'application'

module.exports = class AppLayout extends Backbone.Marionette.Layout
	template: require('views/templates/appLayout')
	el: "body"

	regions:
		menu:    "#menu"
		content: "#content"
		footer: "#footer"
		popup: "#popup"
				