template = require './templates/menu'
Styles = require 'models/styles'
StylesView = require 'views/StylesView'
app = require 'application'

module.exports = class MenuView extends Backbone.Marionette.ItemView

  template: template

  events:
    'submit': 'submit'
    'change #cbo-styles': 'setTheme'
    'change #opt-external-reader': 'setReader'

  setTheme: (evt) =>
    #console.log "Setting app theme..."
    app.setTheme @$('#cbo-styles').val()
    
  setReader: (evt) =>
    #console.log "Setting reader...#{$(evt.target).text()} = #{$(evt.target).is(':checked')}"
    app.setReader $(evt.target).is(':checked')

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
    #@stylesView = new StylesView(collection: new Styles(), el: '#cbo-styles')
    styles = new Styles()
    styles.fetch
      success: =>
        for index in [0..(styles.length - 1)]
          #console.log JSON.stringify styles.at(index).toJSON()
          $option = $("<option>")
          $option.val(styles.at(index).get('value'))
          $option.text(styles.at(index).get('text'))
          @$('#cbo-styles').append $option
        @$('#cbo-styles').val(app.theme)
    @$('#opt-external-reader')[0].checked = app.optExternalReader
    #@$('#opt-external-reader').parent().tooltip placement: 'top'
    #@$('label.checkbox').tooltip placement: 'bottom'
    
  highlight: (where) =>
    @currentRoute = where.href
    #console.log "Navigate to #{where.href or '/'}"
    @$('ul.nav>li').removeClass 'active'
    @$("li>a[data-href='##{where.href}']").parent().addClass 'active'

  setContentsRoute: (href) =>
    @$('#contents-link').attr 'href', href

