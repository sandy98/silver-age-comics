template = require './templates/styleslist'
app = require 'application'

module.exports = class StylesView extends Backbone.Marionette.ItemView
  template: template
  
  initialize: =>
    #console.log "Element: #{@options.el}"
    @el = @options.el
    @collection.fetch
      success: =>
        console.log "Styles collection has #{@collection.length} elements"
        @render()
      error: =>
        console.log "Couldn't retrieve styles from the server ;-("

