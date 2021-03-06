app = require 'application'
Item = require 'models/item'
template = require './templates/reader'

module.exports = class ContentsView extends Backbone.Marionette.ItemView
  template: template

  events:
    'load #current-img': 'onLoadImg'
    'keyup #current-img': 'onKeyUp'
    'click #btn-ensmall': 'onZoomOut'
    'click #btn-enlarge': 'onZoomIn'
    'click #btn-first': 'onFirst'
    'click #btn-prev': 'onPrev'
    'click #btn-next': 'onNext'
    'click #btn-last': 'onLast'

  initialize: =>
    @loaded = false
    $(document.body).on 'keyup', @onKeyUp
    @page = parseInt(@model.get 'page')
    @maxPage = 0
    @zoom = @model.get('zoom') or 70
    @path = @model.get('comic').replace(/_/g, '/')
    #console.log "Path = #{@path}"
    item = new Item path: @path
    item.fetch
      success: (model, response) =>
        @loaded = true
        @comic = model
        @maxPage = model.get('pages').length - 1
        @render()
        #bootbox.alert JSON.stringify(model)
        #console.log "Max page = #{@maxPage}"
      error: (evt) => bootbox.alert "Can't load image<br/>Server possibly down"

  onFirst: =>
    #console.log "Go to First"
    @goto 0

  onPrev: =>
    #console.log "Go to Previous"
    page = @page - 1
    if page > - 1
      @goto page

  onLast: =>
    #console.log "Go to Last"
    @goto @maxPage

  onNext: =>
    #console.log "Go to Next"
    page = @page + 1
    if page <= @maxPage
      @goto page

  goto: (pageNum) =>
    @page = pageNum
    return if (@page < 0) or (@page > @maxPage)
    app.vent.trigger 'reader', {comic: @comic, page: @page, zoom: @zoom, dontReload: true}
    #@setImage()
    
  onKeyUp: (evt) =>
    #console.log evt.which
    switch evt.which
      when 27
        window.location = @$('#btn-library').attr('href')
        return false
      when 107, 187
        @onZoomIn()
        return false
      when 109, 189
        @onZoomOut()
        return false
      when 36, 103
        @onFirst()
        return false
      when 35, 97
        @onLast()
        return false
      when 37, 100
        @onPrev()
        return false
      when 39, 102
        @onNext()
        return false
      when 38, 104 # scroll up
        @$('#current-img').parent()[0].scrollTop = @$('#current-img').parent()[0].scrollTop - @$('#current-img').parent()[0].scrollHeight / 20
        return false
      when 40, 98 # scroll up
        @$('#current-img').parent()[0].scrollTop = @$('#current-img').parent()[0].scrollTop + @$('#current-img').parent()[0].scrollHeight / 20
        return false
      else
        return true

  onZoomOut: =>
    @doZoom -1

  onZoomIn: =>
    @doZoom 1

  doZoom: (direction) =>
    currentZoom = parseInt($('#current-img').attr('width'))
    newZoom = currentZoom + 10 * direction
    if newZoom > 100
      newZoom = 100
    if newZoom < 10
      newZoom = 10
    if newZoom isnt currentZoom
      @zoom = newZoom
      $('#current-img').attr width: "#{newZoom}%", height: "#{newZoom}%"

  onLoadImg:  =>
    #console.log "Image finished loading!"
    $('html').removeClass('busy')
    #@$('#current-img').fadeIn("slow")
    @$('#current-img').effect("slide")

  onCboChange: =>
    @goto parseInt @$('#cbo-pages').val()

  showStatus: =>
    for i in [0..@maxPage]
      @$('#cbo-pages').append $("<option value='#{i}'>#{i + 1}</option>")
    @$('#status-label2').text "of #{@maxPage + 1}"
    @$('#cbo-pages').val "#{@page}"


  onRender: (evt) =>
    #console.log "Now to make tooltips..."
    return if not @loaded
    @$('#btn-library').attr 'href', app.libraryPath
    @$('.btn').tooltip()
    @setImage()
    @$('#cbo-pages').on 'change', @onCboChange

  setImage: =>
    $('html').addClass 'busy'
    src = "page?page=#{@page}&at=#{@path}&pages=#{@maxPage + 1}"
    @$('#current-img').off 'load'
    @$('#current-img').on 'load', @onLoadImg
    @$('#current-img').attr 'src': src, 'width': "#{@zoom}%", "height": "#{@zoom}%"
    #@onLoadImg()
    @showStatus()
    
  
