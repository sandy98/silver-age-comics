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
          'reader/:comic/:page/:zoom': 'reader'
          'dologout': 'logout'
          'newuser':  'newuser'
          'edituser': 'edituser'

        home: =>
          $(document.body).off 'keyup'
          hv = new HomeView()
          application.vent.trigger 'navigation', {href: "", view: hv}

        reader: (comic, page, zoom) =>
          $(document.body).off 'keyup'
          page = 0 if not page
          zoom = 70 if not zoom
          rv = new ReaderView model: new Backbone.Model {comic :comic, page: page, zoom: zoom}
          application.vent.trigger 'navigation', {href: "reader", view: rv}

        contents: (path, page) =>
          $(document.body).off 'keyup'
          if application.currentView?.constructor.name is 'ContentsView'
            cv = application.currentView
          else
            cv = new ContentsView()
          application.contentsView = cv
          application.vent.trigger 'navigation', {href: "contents", view: cv, path: path or "_", page: page or "0"}


        about: =>
          $(document.body).off 'keyup'
          av = new AboutView()
          application.vent.trigger 'navigation', {href: "about", view: av}

        logout: =>
          $(document.body).off 'keyup'
          application.vent.trigger 'logout'
          @navigate application.menuView.currentRoute, trigger: true

        newuser: =>
          $(document.body).off 'keyup'
          application.vent.trigger 'newuser'
          @navigate application.menuView.currentRoute, trigger: true

        edituser: =>
          $(document.body).off 'keyup'
          application.vent.trigger 'edituser'
          @navigate application.menuView.currentRoute, trigger: true
