require 'lib/view_helper'

User = require 'models/user'
Item = require 'models/item'
Items = require 'models/items'

class Application extends Backbone.Marionette.Application

    @VERSION: '0.1.1'

    getVisitors: (cb) =>
      $.get '/visitors', (visitors) -> cb visitors

    optExternalReader: false

    initialize: =>

        UserItemView = require 'views/UserItemView'

        @currentView = null

        @dataSource = require './datasource'

        @user = new User
        @item = new Item app: @, path: ''

        @vent.on 'reader', (item) =>
          page = item.page
          comic = item.comic
          zoom = item.zoom or 70
          path = comic.get 'path'
          route = "reader/#{path.replace(/\//g, '_')}/#{page}/#{zoom}"
          route = route.replace('__', '_')
          route = route.replace('//', '/_/')
          @router.navigate route, true

        @vent.on 'item:selected', (item) =>
          #@item = item
          path = item.get('path')
          page = item.get 'currentPage'
          #console.log "In app received 'item:selected' event with item.path = #{path} and item.currentPage = #{page}"
          route = "contents/#{path.replace(/\//g, '_')}/#{page}"
          route = route.replace('__', '_')
          route = route.replace('//', '/_/')
          #console.log "Now to navigate to #{route}"
          @router.navigate route, true

        @vent.on 'navigation', (where) =>
          #console.log "@#{where.href}@"
          if (@user.get 'username') or (not @user.get 'username')
            #@layout.content.show where.view
            oldView = @currentView
            @currentView = where.view
            if where.href is 'contents'
              @menuView.setContentsRoute "#contents/#{where.path}/#{where.page}"
              path = where.path.replace(/_/g, '/') or '/'
              #console.log "Handling contents navigation within App.\nReceived path: #{path}\nReceived page:#{where.page}"
              #bootbox.alert "Current item path: #{@item?.get 'path'}<br/>New item path: #{path}"
              if @item?.get('path') is path
                console.log "No need to fetch data from server"
                @item.set 'currentPage', parseInt(where.page)
                @layout.content.show where.view
                @vent.trigger 'item:loaded', @item
              else 
                @item = new Item(path: path, currentPage: parseInt(where.page))
                @item.fetch
                  success: (model, response) =>
                    @layout.content.show where.view
                    @vent.trigger 'item:loaded', @item
                  error: (evt) =>
                    bootbox.alert "Server possibly down"
            else      
              @layout.content.show where.view
            @menuView.highlight where
          else
            if where.href is 'contents'
              @router.navigate '', trigger: true
              bootbox.alert 'Must be logged in to access contents.'
            else
              @layout.content.show where.view
              @menuView.highlight where

        @vent.on 'login', (user) =>
          console.log "login: #{user.get('username')}"
          @user = user
          @menuView.model = @user
          @layout.menu.show @menuView

        @vent.on 'logout',  =>
          console.log 'logout'
          @user = new User
          @menuView.model = @user
          @layout.menu.show @menuView
          @router.navigate '', trigger: true

        @vent.on 'newuser', =>
          #model = new Backbone.Model({title: 'New User', message: 'User sign up data goes here.'})

          popupView = new UserItemView vent: @vent, model: new User, dataSource: @dataSource, mode: 'insert'
          @layout.popup.show popupView

        @vent.on 'edituser', =>
          popupView = new UserItemView vent: @vent, model: @user, dataSource: @dataSource, mode: 'update'
          @layout.popup.show popupView

        @on("initialize:after", (options) =>
            Backbone.history.start()
            # Freeze the object
            #Object.freeze? @

        )


        @addInitializer((options) =>
          $(document).ajaxStart(-> $('#ajax-loader').show())
          $(document).ajaxStop(-> $('#ajax-loader').hide())
        )

        @addInitializer( (options) =>

            AppLayout = require 'views/AppLayout'
            MenuView = require 'views/MenuView'
            FooterView = require 'views/FooterView'
            @layout = new AppLayout()
            @layout.render()
            @menuView = new MenuView(vent: @vent, dataSource: @dataSource, model: @user)
            @layout.menu.show @menuView
            @footerView = new FooterView(vent: @vent)
            @layout.footer.show @footerView

        )

        @addInitializer((options) =>
            # Instantiate the router
            Router = require 'lib/router'
            @router = new Router()

        )

        @start()



module.exports = new Application()
