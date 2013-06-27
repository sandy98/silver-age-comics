template = require './templates/reader'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.ItemView
  template: template

  initialize: (@comic = null, @page = 0) =>

  onRender: (evt) =>
    console.log "Now to make tooltips..."
    @$('.btn').tooltip()

