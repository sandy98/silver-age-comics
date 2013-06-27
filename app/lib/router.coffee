application = require('application')
HomeView = require('views/HomeView')
ContentsView = require('views/ContentsView')
AboutView = require('views/AboutView')
ReaderView = require('views/ReaderView')

module.exports = class Router extends Backbone.Router

        routes:
          '':         'home'
          'contents': 'contents'
          'contents/:path': 'contents'
          'contents/:path/:page': 'contents'
          'about':    'about'
          'reader':   'reader'
          'reader/:comic': 'reader'
          'reader/:comic/:page': 'reader'
          'dologout': 'logout'
          'newuser':  'newuser'
          'edituser': 'edituser'

        home: =>
          hv = new HomeView()
          application.vent.trigger 'navigation', {href: "", view: hv}

        reader: (comic, page) =>
          page = 0 if not page
          rv = new ReaderView comic, page
          application.vent.trigger 'navigation', {href: "reader", view: rv}

        contents: (path, page) =>
          cv = new ContentsView()
          application.contentsView = cv
          application.vent.trigger 'navigation', {href: "contents", view: cv, path: path or "_", page: page or "0"}


        about: =>
          av = new AboutView()
          application.vent.trigger 'navigation', {href: "about", view: av}


        logout: =>
          application.vent.trigger 'logout'
          @navigate application.menuView.currentRoute, trigger: true


        newuser: =>
          application.vent.trigger 'newuser'
          @navigate application.menuView.currentRoute, trigger: true


        edituser: =>
          application.vent.trigger 'edituser'
          @navigate application.menuView.currentRoute, trigger: true
