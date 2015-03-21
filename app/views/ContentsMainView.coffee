template = require './templates/contents_main'
Item = require 'models/item'
Items = require 'models/items'
ItemListView = require 'views/ItemListView'
app = require 'application'

module.exports = class ContentsView extends Backbone.Marionette.CompositeView
  template: template

  itemViewContainer: "#dir-list"

  itemView: ItemListView

  initialize: =>
    @direction = "left"
    $(document.body).on 'keyup', @onKeyUp
    app.vent.on 'item:loaded', (item) =>
      #app.item = item
      @reload()
    app.vent.on 'thumb:loaded', @doDeferImgNotify
    @$el.on 'click', '.btn', @onNavigate
    ##@$el.on 'change', '#opt-external-reader', =>
      ##app.setReader(if @$('#opt-external-reader').is(':checked') then true else false)
      ##console.log "External reader:", app.optExternalReader
    #@$el.on 'load error', 'ul img', @doDeferImgNotify

    @reload()

  onKeyUp: (evt) =>
    #console.log evt.which
    switch evt.which
      when 36, 103
        @first()
        return false
      when 35, 97
        @last()
        return false
      when 37, 100
        @prev()
        return false
      when 39, 102
        @next()
        return false
      else
        return true


  reload: =>
    @model = app.item
    #@model.on 'all', @loadItems
    ###
    @model.fetch
      success: (model, response) =>
        @loadItems()
      error: (evt) =>
        #bootbox.alert "Server is not responding..."    
    ###
    @loadItems()
    

  loadItems: (evt) =>
    @fullCollection = new Items @model.get 'files'
    ###
    if @model.get('currentPage') > @fullCollection.maxPage()
      @fullCollection.currentPage = @fullCollection.maxPage()
      @model.set('currentPage', @fullCollection.currentPage)
    else    
      @fullCollection.currentPage = @model.get('currentPage')
    if @fullCollection.currentPage < 0
      @model.set('currentPage', 0)
      @fullCollection.currentPage = 0  
    ###
    @fullCollection.currentPage = @model.get('currentPage')
    @collection = @fullCollection.parse()
    @render()

  doDeferImgNotify: =>
    #console.log "This is 'doDeferImgNotify'"
    @$deferImg.notify()
      
  onDeferImgProgress: =>
    @imgLoaded += 1
    console.log "Loaded #{@imgLoaded} images out of #{@imgLen}"
    @$('#progress-bar').css width: "#{(@imgLoaded + 1) / @imgLen * 100}%"
    if @imgLoaded >= (@imgLen - 1)
      @$deferImg.resolve()
  
  onDeferImgResolve: =>
    setTimeout(
      =>
        @$('#progress-wrapper').hide()
        #@$('.thumbnails').slideDown(200)
        @doSlide()
        $('html').removeClass 'busy'
      0
    )
  
  doSlide: =>
    console.log "Sliding thumbs in the #{@direction} direction"
    @$('.thumbnails').effect 'slide', direction: @direction

  onRender: =>
    $('html').addClass 'busy'
    #@$('#opt-external-reader').parent().tooltip placement: 'top'
    
    start = @fullCollection?.currentPage * @fullCollection?.perPage + 1
    end = start + @fullCollection?.perPage - 1
    total = @fullCollection?.length
    if end > total
      end = total
    @$('#page-status').text "#{start} - #{end} of #{total}"

    #if app.optExternalReader is true
    #  @$('#opt-external-reader').attr 'checked', 'checked'
    
    @imgLen = @$('img').length
    @imgLoaded = 0
    @$deferImg = new $.Deferred()
    @$deferImg.progress @onDeferImgProgress
    @$deferImg.done @onDeferImgResolve
    @$('img').on 'load', @doDeferImgNotify
    @$('img').on 'error', @doDeferImgNotify

  onNavigate: (evt) =>
    @[$(evt.target).attr("data-nav")]()

  first: =>
    @goto 0

  last: =>
    @goto @fullCollection.maxPage()

  prev: =>
    @goto @fullCollection.currentPage - 1

  next: =>
    @goto @fullCollection.currentPage + 1

  goto: (page) =>
    if page < 0
      page = 0
    max = @fullCollection.maxPage()
    if page > max
      page = max

    return if page is @fullCollection.currentPage
    @direction = if page > @fullCollection.currentPage then "left" else "right"
    @fullCollection.currentPage = page
    @model.set 'currentPage', page
    #@collection = @fullCollection.parse()
    #@render()
    app.vent.trigger "item:selected", @model, @direction
