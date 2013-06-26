template = require './templates/menu'

module.exports = class MenuView extends Backbone.Marionette.ItemView

  template: template

  events:
    'submit': 'submit'

  submit: (ev) =>
    ev.preventDefault?()
    return false unless @$('.username-input').val() and @$('.pwd-input').val()
    #console.log 'submit user data'
    @setFakeUser username: @$('.username-input').val(), pwd: @$('.pwd-input').val()
    false

  setFakeUser: (userdata) =>
    #To be overridden by a call to the server to get real data in a production app.
    @options.dataSource.getUser userdata.username, userdata.pwd, (err, user) =>
      if user
        @options.vent.trigger 'login', user
      else
        bootbox.alert err

  onRender: =>
    #@$("li>a[href='##{@currentRoute}']").parent().addClass 'active'
    @highlight href: @currentRoute
    @$('a[href="#newuser"], a[href="#edituser"]').tooltip placement: 'bottom'
    #@$('.navbar-inner').after("<img src='img/supes_logo.jpg' width='3%' height='3%' />")

  highlight: (where) =>
    @currentRoute = where.href
    #console.log "Navigate to #{where.href or '/'}"
    @$('ul.nav>li').removeClass 'active'
    @$("li>a[data-href='##{where.href}']").parent().addClass 'active'

  setContentsRoute: (href) =>
    @$('#contents-link').attr 'href', href

