application = require('application')
HomeView = require('views/HomeView')
ContentsView = require('views/ContentsView')
AboutView = require('views/AboutView')

module.exports = class Router extends Backbone.Router

        routes:
          '':         'home'
          'contents': 'contents'
          'contents/:path': 'contents'
          'contents/:path/:page': 'contents'
          'about':    'about'
          'dologout': 'logout'
          'newuser':  'newuser'
          'edituser': 'edituser'

        home: =>
          hv = new HomeView()
          application.vent.trigger 'navigation', {href: "", view: hv}


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
