template = require './templates/contents'
app = require 'application'
ContentsBCView = require './ContentsBCView'
ContentsMainView = require './ContentsMainView'

module.exports = class ContentsView extends Backbone.Marionette.Layout
  template: template

  initialize: =>
    @item = app.item
    @bcView = new ContentsBCView @item
    @mainView = new ContentsMainView @item

  onRender: (evt) =>
    @breadcrumbs.show @bcView
    @main.show @mainView

  regions:
    breadcrumbs: '#contents-bc'
    main: '#contents-main'