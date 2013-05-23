GenericPopupView = require 'views/GenericPopupView'
template = require 'views/templates/comicsreaderview'


module.exports = class UserItemView extends GenericPopupView
  template: template

  initialize: =>
    @model.on 'change', @renderPage

  renderPage: =>
    @$('#page-show').attr 'src', "page?page=#{@model.get('currentPage')}&at=#{@model.get('path')}"
    @$('.pagination li').removeClass 'active'
    @$("li[data-number=\"#{@model.get('currentPage')}\"]").addClass 'active'
    @$('.modal-body')[0].scrollTop = 0

  onRender: (evt) =>
    @renderPage()

  resize: (direction) =>
    factor = if direction is '+' then 1 else -1
    curr_size = parseInt(@$('#page-show').attr 'width')
    new_size = curr_size + (10 * factor)
    if new_size > 100
      new_size = 100
    if new_size < 10
      new_size = 10
    @$('#page-show').attr width: "#{new_size}%", height: "#{new_size}%"

  onBtnClick: (evt) =>
    evt.preventDefault?()
    action = ''
    if evt.target.className.match /btn-save/
      action = 'save'
    if evt.target.className.match /btn-cancel/
      action = 'cancel'

    if action
      return @$('div.modal').modal('hide')
    else
      text = $(evt.target).text()
      if text.toLowerCase() in ['first','prev','next','last']
        return @[text.toLowerCase()]()
      if text.toLowerCase() in ['+','-']
        return @resize(text)
      else
        return @model.set("currentPage", parseInt(text) - 1)

  maxPage: =>
    @model.get('pages').length - 1

  first: =>
    @model.set("currentPage", 0)

  last: =>
    @model.set("currentPage", @maxPage())

  prev: =>
    curr = parseInt(@model.get("currentPage")) - 1
    if curr < 0
      curr = 0
    @model.set("currentPage", curr)

  next: =>
    curr = parseInt(@model.get("currentPage")) + 1
    if curr > @maxPage()
      curr = @maxPage()
    @model.set("currentPage", curr)
