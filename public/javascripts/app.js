(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.brunch = true;
})();

window.require.register("application", function(exports, require, module) {
  (function() {
    var Application, Item, Items, User,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    require('lib/view_helper');

    User = require('models/user');

    Item = require('models/item');

    Items = require('models/items');

    Application = (function(_super) {

      __extends(Application, _super);

      function Application() {
        this.initialize = __bind(this.initialize, this);
        Application.__super__.constructor.apply(this, arguments);
      }

      Application.VERSION = '0.1.1';

      Application.prototype.initialize = function() {
        var UserItemView,
          _this = this;
        UserItemView = require('views/UserItemView');
        this.dataSource = require('./datasource');
        this.user = new User;
        this.item = new Item({
          app: this,
          path: ''
        });
        this.vent.on('navigation', function(where) {
          console.log("@" + where.href + "@");
          if ((_this.user.get('username')) || (!_this.user.get('username'))) {
            _this.layout.content.show(where.view);
            return _this.menuView.highlight(where);
          } else {
            if (where.href === 'contents') {
              _this.router.navigate('', {
                trigger: true
              });
              return bootbox.alert('Must be logged in to access contents.');
            } else {
              _this.layout.content.show(where.view);
              return _this.menuView.highlight(where);
            }
          }
        });
        this.vent.on('login', function(user) {
          console.log("login: " + (user.get('username')));
          _this.user = user;
          _this.menuView.model = _this.user;
          return _this.layout.menu.show(_this.menuView);
        });
        this.vent.on('logout', function() {
          console.log('logout');
          _this.user = new User;
          _this.menuView.model = _this.user;
          _this.layout.menu.show(_this.menuView);
          return _this.router.navigate('', {
            trigger: true
          });
        });
        this.vent.on('newuser', function() {
          var popupView;
          popupView = new UserItemView({
            vent: _this.vent,
            model: new User,
            dataSource: _this.dataSource,
            mode: 'insert'
          });
          return _this.layout.popup.show(popupView);
        });
        this.vent.on('edituser', function() {
          var popupView;
          popupView = new UserItemView({
            vent: _this.vent,
            model: _this.user,
            dataSource: _this.dataSource,
            mode: 'update'
          });
          return _this.layout.popup.show(popupView);
        });
        this.on("initialize:after", function(options) {
          return Backbone.history.start();
        });
        this.addInitializer(function(options) {
          $('#ajax-loader').ajaxStart(function() {
            return $('#ajax-loader').show();
          });
          return $('#ajax-loader').ajaxStop(function() {
            return $('#ajax-loader').hide();
          });
        });
        this.addInitializer(function(options) {
          var AppLayout, FooterView, MenuView;
          AppLayout = require('views/AppLayout');
          MenuView = require('views/MenuView');
          FooterView = require('views/FooterView');
          _this.layout = new AppLayout();
          _this.layout.render();
          _this.menuView = new MenuView({
            vent: _this.vent,
            dataSource: _this.dataSource,
            model: _this.user
          });
          _this.layout.menu.show(_this.menuView);
          _this.footerView = new FooterView({
            vent: _this.vent
          });
          return _this.layout.footer.show(_this.footerView);
        });
        this.addInitializer(function(options) {
          var Router;
          Router = require('lib/router');
          return _this.router = new Router();
        });
        return this.start();
      };

      return Application;

    })(Backbone.Marionette.Application);

    module.exports = new Application();

  }).call(this);
  
});
window.require.register("datasource", function(exports, require, module) {
  (function() {
    var DataSource,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    DataSource = (function() {

      function DataSource() {
        this.updateUser = __bind(this.updateUser, this);
        this.insertUser = __bind(this.insertUser, this);
        this.getUserByCid = __bind(this.getUserByCid, this);
        this.getUser = __bind(this.getUser, this);
      }

      DataSource.prototype.users = new Backbone.Collection([
        new Backbone.Model({
          username: 'lar-gand',
          fullname: 'Mon-El',
          pwd: 'daxamite',
          email: 'daxam@gmail.com'
        }), new Backbone.Model({
          username: 'kal-el',
          fullname: 'Superboy',
          pwd: 'kryptonian',
          email: 'krypton@gmail.com'
        }), new Backbone.Model({
          username: 'rokk-krinn',
          fullname: 'Cosmic Boy',
          pwd: 'braalian',
          email: 'braal@gmail.com'
        })
      ]);

      DataSource.prototype.getUser = function(username, pwd, cb) {
        var index, len, msg, user, _ref;
        len = this.users.length;
        for (index = 0, _ref = len - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
          user = this.users.at(index);
          if ((user.get('username').toLowerCase() === username.toLowerCase() || user.get('email').toLowerCase() === username.toLowerCase()) && user.get('pwd') === pwd) {
            if (cb) cb(null, user);
            return user;
          }
        }
        if (cb) {
          msg = 'Wrong username and/or password';
          cb(msg, null);
        }
        return msg;
      };

      DataSource.prototype.getUserByCid = function(cid, cb) {
        var index, len, msg, user, _ref;
        len = this.users.length;
        for (index = 0, _ref = len - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
          user = this.users.at(index);
          if (user.cid === cid) {
            if (cb) cb(null, user);
            return user;
          }
        }
        if (cb) {
          msg = 'Cid not found';
          cb(msg, null);
        }
        return msg;
      };

      DataSource.prototype.insertUser = function(user, cb) {
        this.users.add(user);
        if (cb) return cb(null, user);
      };

      DataSource.prototype.updateUser = function(cid, userData, cb) {
        var index, len, user, _ref;
        len = this.users.length;
        for (index = 0, _ref = len - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
          user = this.users.at(index);
          if (user.cid === cid) {
            user.set(userData);
            if (cb) cb(null, user);
            return user;
          }
        }
        if (cb) cb('Wrong user', null);
        return null;
      };

      return DataSource;

    })();

    module.exports = new DataSource;

  }).call(this);
  
});
window.require.register("initialize", function(exports, require, module) {
  (function() {
    var application;

    window.app = application = require('application');

    $(function() {
      return application.initialize();
    });

  }).call(this);
  
});
window.require.register("lib/router", function(exports, require, module) {
  (function() {
    var AboutView, ContentsView, HomeView, Router, application,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    application = require('application');

    HomeView = require('views/HomeView');

    ContentsView = require('views/ContentsView');

    AboutView = require('views/AboutView');

    module.exports = Router = (function(_super) {

      __extends(Router, _super);

      function Router() {
        this.edituser = __bind(this.edituser, this);
        this.newuser = __bind(this.newuser, this);
        this.logout = __bind(this.logout, this);
        this.about = __bind(this.about, this);
        this.contents = __bind(this.contents, this);
        this.home = __bind(this.home, this);
        Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.routes = {
        '': 'home',
        'contents': 'contents',
        'about': 'about',
        'dologout': 'logout',
        'newuser': 'newuser',
        'edituser': 'edituser'
      };

      Router.prototype.home = function() {
        var hv;
        hv = new HomeView();
        return application.vent.trigger('navigation', {
          href: "",
          view: hv
        });
      };

      Router.prototype.contents = function() {
        var cv;
        cv = new ContentsView();
        application.contentsView = cv;
        return application.vent.trigger('navigation', {
          href: "contents",
          view: cv
        });
      };

      Router.prototype.about = function() {
        var av;
        av = new AboutView();
        return application.vent.trigger('navigation', {
          href: "about",
          view: av
        });
      };

      Router.prototype.logout = function() {
        application.vent.trigger('logout');
        return this.navigate(application.menuView.currentRoute, {
          trigger: true
        });
      };

      Router.prototype.newuser = function() {
        application.vent.trigger('newuser');
        return this.navigate(application.menuView.currentRoute, {
          trigger: true
        });
      };

      Router.prototype.edituser = function() {
        application.vent.trigger('edituser');
        return this.navigate(application.menuView.currentRoute, {
          trigger: true
        });
      };

      return Router;

    })(Backbone.Router);

  }).call(this);
  
});
window.require.register("lib/utils", function(exports, require, module) {
  (function() {
    var utils;

    utils = {
      butlast: function(li) {
        var x, _i, _len, _ref, _results;
        _ref = li.slice(0, (li.length - 1));
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x);
        }
        return _results;
      },
      breadcrumbs: function(li) {
        var bc;
        bc = function(li) {
          var arr;
          if (li.length === 0) return [];
          arr = bc(utils.butlast(li));
          arr.unshift(li);
          return arr;
        };
        return bc(li).reverse();
      }
    };

    module.exports = utils;

  }).call(this);
  
});
window.require.register("lib/view_helper", function(exports, require, module) {
  (function() {

    Handlebars.registerHelper('pick', function(val, options) {
      return options.hash[val];
    });

  }).call(this);
  
});
window.require.register("models/collection", function(exports, require, module) {
  (function() {
    var Collection,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    module.exports = Collection = (function(_super) {

      __extends(Collection, _super);

      function Collection() {
        Collection.__super__.constructor.apply(this, arguments);
      }

      return Collection;

    })(Backbone.Collection);

  }).call(this);
  
});
window.require.register("models/item", function(exports, require, module) {
  (function() {
    var Item, utils,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    utils = require('../lib/utils');

    module.exports = Item = (function(_super) {

      __extends(Item, _super);

      function Item() {
        this.toJSON = __bind(this.toJSON, this);
        this.pageNumbers = __bind(this.pageNumbers, this);
        this.hideExtension = __bind(this.hideExtension, this);
        this.breadcrumbs = __bind(this.breadcrumbs, this);
        this.splitNames = __bind(this.splitNames, this);
        this.isComic = __bind(this.isComic, this);
        this.isDirectory = __bind(this.isDirectory, this);
        this.urlRoot = __bind(this.urlRoot, this);
        Item.__super__.constructor.apply(this, arguments);
      }

      Item.prototype.urlRoot = function() {
        return "item?at=" + (this.get('path'));
      };

      Item.prototype.defaults = {
        name: '',
        path: '',
        type: 'directory'
      };

      Item.prototype.isDirectory = function() {
        return this.get('type') === 'directory';
      };

      Item.prototype.isComic = function() {
        return (this.get('type') === 'rarfile') || (this.get('type') === 'zipfile');
      };

      Item.prototype.splitNames = function() {
        return this.get('path').split('/');
      };

      Item.prototype.breadcrumbs = function() {
        return utils.breadcrumbs(this.splitNames()).map(function(arr) {
          return arr.join('/');
        });
      };

      Item.prototype.hideExtension = function() {
        return this.get('name').replace('.cbr', '').replace('.cbz', '');
      };

      Item.prototype.pageNumbers = function() {
        var n, pages, _ref, _results;
        pages = this.get('pages');
        if (!pages) return [];
        _results = [];
        for (n = 1, _ref = pages.length; 1 <= _ref ? n <= _ref : n >= _ref; 1 <= _ref ? n++ : n--) {
          _results.push({
            shown: n,
            real: n - 1
          });
        }
        return _results;
      };

      Item.prototype.toJSON = function() {
        var base, n;
        base = _.clone(this.attributes);
        base.isDirectory = this.isDirectory();
        base.isComic = this.isComic();
        base.ancestryNames = this.splitNames();
        base.ancestryPaths = this.breadcrumbs();
        base.ancestryObjs = (function() {
          var _ref, _results;
          _results = [];
          for (n = 0, _ref = base.ancestryNames.length - 1; 0 <= _ref ? n <= _ref : n >= _ref; 0 <= _ref ? n++ : n--) {
            _results.push({
              name: base.ancestryNames[n],
              path: base.ancestryPaths[n]
            });
          }
          return _results;
        })();
        base.bareName = this.hideExtension();
        base.pageNumbers = this.pageNumbers();
        return base;
      };

      return Item;

    })(Backbone.Model);

  }).call(this);
  
});
window.require.register("models/items", function(exports, require, module) {
  (function() {
    var Item, Items,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    Item = require('models/item');

    module.exports = Items = (function(_super) {

      __extends(Items, _super);

      function Items() {
        this.maxPage = __bind(this.maxPage, this);
        this.parse = __bind(this.parse, this);
        this.toJSON = __bind(this.toJSON, this);
        Items.__super__.constructor.apply(this, arguments);
      }

      Items.prototype.model = Item;

      Items.prototype.firstPage = 0;

      Items.prototype.currentPage = 0;

      Items.prototype.perPage = 5;

      Items.prototype.toJSON = function() {
        var end, start;
        start = this.currentPage * this.perPage;
        end = start + this.perPage;
        return this.models.slice(start, end);
      };

      Items.prototype.parse = function() {
        return new Backbone.Collection(this.toJSON());
      };

      Items.prototype.maxPage = function() {
        return Math.ceil(this.models.length / this.perPage) - 1;
      };

      return Items;

    })(Backbone.Collection);

  }).call(this);
  
});
window.require.register("models/model", function(exports, require, module) {
  (function() {
    var Model,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    module.exports = Model = (function(_super) {

      __extends(Model, _super);

      function Model() {
        Model.__super__.constructor.apply(this, arguments);
      }

      return Model;

    })(Backbone.Model);

  }).call(this);
  
});
window.require.register("models/user", function(exports, require, module) {
  (function() {
    var User,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    User = (function(_super) {

      __extends(User, _super);

      function User() {
        User.__super__.constructor.apply(this, arguments);
      }

      User.prototype.idAttribute = "_id";

      User.prototype.urlRoot = '/users';

      User.prototype.defaults = {
        fullname: '',
        username: '',
        birth: '',
        pwd: '',
        email: '',
        role: 'user'
      };

      User.prototype.initialize = function() {
        if (!this.birth) return this.birth = moment().format('YYYY-MM-DD');
      };

      User.prototype.validate = function() {
        if (!this.get('fullname')) {
          bootbox.alert("Can't save.\nReason: User full name can't be blank.", {
            dropback: false
          });
          return true;
        }
        if (!this.get('nick')) {
          bootbox.alert("Can't save.\nReason: username can't be blank.");
          return true;
        }
        if (!this.get('pwd')) {
          bootbox.alert("Can't save.\nReason: password can't be blank.");
          return true;
        }
        if (!this.get('birth')) {
          bootbox.alert("Can't save.\nReason: birth date can't be null.");
          return true;
        }
        if (!this.get('email') || (!this.get('email').match(/^\w+@\w+(\.\w+)*$/))) {
          bootbox.alert("Can't save.\nReason: user email is wrong.");
          return true;
        }
      };

      return User;

    })(Backbone.Model);

    module.exports = User;

  }).call(this);
  
});
window.require.register("views/AboutView", function(exports, require, module) {
  (function() {
    var AboutView, template,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/about');

    module.exports = AboutView = (function(_super) {

      __extends(AboutView, _super);

      function AboutView() {
        AboutView.__super__.constructor.apply(this, arguments);
      }

      AboutView.prototype.id = 'about-view';

      AboutView.prototype.template = template;

      return AboutView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/AppLayout", function(exports, require, module) {
  (function() {
    var AppLayout, application,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    application = require('application');

    module.exports = AppLayout = (function(_super) {

      __extends(AppLayout, _super);

      function AppLayout() {
        AppLayout.__super__.constructor.apply(this, arguments);
      }

      AppLayout.prototype.template = require('views/templates/appLayout');

      AppLayout.prototype.el = "body";

      AppLayout.prototype.regions = {
        menu: "#menu",
        content: "#content",
        footer: "#footer",
        popup: "#popup"
      };

      return AppLayout;

    })(Backbone.Marionette.Layout);

  }).call(this);
  
});
window.require.register("views/ComicsReaderView", function(exports, require, module) {
  (function() {
    var GenericPopupView, UserItemView, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    GenericPopupView = require('views/GenericPopupView');

    template = require('views/templates/comicsreaderview');

    module.exports = UserItemView = (function(_super) {

      __extends(UserItemView, _super);

      function UserItemView() {
        this.next = __bind(this.next, this);
        this.prev = __bind(this.prev, this);
        this.last = __bind(this.last, this);
        this.first = __bind(this.first, this);
        this.maxPage = __bind(this.maxPage, this);
        this.onBtnClick = __bind(this.onBtnClick, this);
        this.resize = __bind(this.resize, this);
        this.onRender = __bind(this.onRender, this);
        this.renderPage = __bind(this.renderPage, this);
        this.initialize = __bind(this.initialize, this);
        UserItemView.__super__.constructor.apply(this, arguments);
      }

      UserItemView.prototype.template = template;

      UserItemView.prototype.initialize = function() {
        return this.model.on('change', this.renderPage);
      };

      UserItemView.prototype.renderPage = function() {
        this.$('#page-show').attr('src', "page?page=" + (this.model.get('currentPage')) + "&at=" + (this.model.get('path')));
        this.$('.pagination li').removeClass('active');
        this.$("li[data-number=\"" + (this.model.get('currentPage')) + "\"]").addClass('active');
        return this.$('.modal-body')[0].scrollTop = 0;
      };

      UserItemView.prototype.onRender = function(evt) {
        return this.renderPage();
      };

      UserItemView.prototype.resize = function(direction) {
        var curr_size, factor, new_size;
        factor = direction === '+' ? 1 : -1;
        curr_size = parseInt(this.$('#page-show').attr('width'));
        new_size = curr_size + (10 * factor);
        if (new_size > 100) new_size = 100;
        if (new_size < 10) new_size = 10;
        return this.$('#page-show').attr({
          width: "" + new_size + "%",
          height: "" + new_size + "%"
        });
      };

      UserItemView.prototype.onBtnClick = function(evt) {
        var action, text, _ref, _ref2;
        if (typeof evt.preventDefault === "function") evt.preventDefault();
        action = '';
        if (evt.target.className.match(/btn-save/)) action = 'save';
        if (evt.target.className.match(/btn-cancel/)) action = 'cancel';
        if (action) {
          return this.$('div.modal').modal('hide');
        } else {
          text = $(evt.target).text();
          if ((_ref = text.toLowerCase()) === 'first' || _ref === 'prev' || _ref === 'next' || _ref === 'last') {
            return this[text.toLowerCase()]();
          }
          if ((_ref2 = text.toLowerCase()) === '+' || _ref2 === '-') {
            return this.resize(text);
          } else {
            return this.model.set("currentPage", parseInt(text) - 1);
          }
        }
      };

      UserItemView.prototype.maxPage = function() {
        return this.model.get('pages').length - 1;
      };

      UserItemView.prototype.first = function() {
        return this.model.set("currentPage", 0);
      };

      UserItemView.prototype.last = function() {
        return this.model.set("currentPage", this.maxPage());
      };

      UserItemView.prototype.prev = function() {
        var curr;
        curr = parseInt(this.model.get("currentPage")) - 1;
        if (curr < 0) curr = 0;
        return this.model.set("currentPage", curr);
      };

      UserItemView.prototype.next = function() {
        var curr;
        curr = parseInt(this.model.get("currentPage")) + 1;
        if (curr > this.maxPage()) curr = this.maxPage();
        return this.model.set("currentPage", curr);
      };

      return UserItemView;

    })(GenericPopupView);

  }).call(this);
  
});
window.require.register("views/ContentsBCView", function(exports, require, module) {
  (function() {
    var ContentsView, Item, Items, app, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/contents_bc');

    Item = require('models/item');

    Items = require('models/items');

    app = require('application');

    module.exports = ContentsView = (function(_super) {

      __extends(ContentsView, _super);

      function ContentsView() {
        this.onRender = __bind(this.onRender, this);
        this.onClick = __bind(this.onClick, this);
        this.reload = __bind(this.reload, this);
        this.initialize = __bind(this.initialize, this);
        ContentsView.__super__.constructor.apply(this, arguments);
      }

      ContentsView.prototype.template = template;

      ContentsView.prototype.initialize = function() {
        var _this = this;
        app.vent.on('item:selected', function(item) {
          _this.model = item;
          return _this.render();
        });
        return this.reload();
      };

      ContentsView.prototype.reload = function() {
        this.model = app.item;
        this.model.on('all', this.render);
        return this.model.fetch();
      };

      ContentsView.prototype.events = {
        'click a': 'onClick'
      };

      ContentsView.prototype.onClick = function(evt) {
        var _this = this;
        if (typeof evt.preventDefault === "function") evt.preventDefault();
        console.log("Clicked on " + ($(evt.target).attr('data-path')));
        this.model = new Item({
          path: $(evt.target).attr('data-path')
        });
        this.model.fetch({
          success: function(model, response) {
            return app.vent.trigger("item:selected", model);
          },
          error: function() {
            return bootbox.alert("Warning: server is not responding.");
          }
        });
        return false;
      };

      ContentsView.prototype.onRender = function(evt) {
        this.$('li:last').addClass('active');
        return this.$('span.divider:last').remove();
      };

      return ContentsView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/ContentsMainView", function(exports, require, module) {
  (function() {
    var ContentsView, Item, ItemListView, Items, app, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/contents_main');

    Item = require('models/item');

    Items = require('models/items');

    ItemListView = require('views/ItemListView');

    app = require('application');

    module.exports = ContentsView = (function(_super) {

      __extends(ContentsView, _super);

      function ContentsView() {
        this.goto = __bind(this.goto, this);
        this.next = __bind(this.next, this);
        this.prev = __bind(this.prev, this);
        this.last = __bind(this.last, this);
        this.first = __bind(this.first, this);
        this.onNavigate = __bind(this.onNavigate, this);
        this.onRender = __bind(this.onRender, this);
        this.loadItems = __bind(this.loadItems, this);
        this.reload = __bind(this.reload, this);
        this.initialize = __bind(this.initialize, this);
        ContentsView.__super__.constructor.apply(this, arguments);
      }

      ContentsView.prototype.template = template;

      ContentsView.prototype.itemViewContainer = "#dir-list";

      ContentsView.prototype.itemView = ItemListView;

      ContentsView.prototype.initialize = function() {
        var _this = this;
        app.vent.on('item:selected', function(item) {
          app.item = item;
          return _this.reload();
        });
        return this.reload();
      };

      ContentsView.prototype.reload = function() {
        this.model = app.item;
        this.model.on('all', this.loadItems);
        return this.model.fetch();
      };

      ContentsView.prototype.loadItems = function(evt) {
        this.fullCollection = new Items(this.model.get('files'));
        this.collection = this.fullCollection.parse();
        return this.render();
      };

      ContentsView.prototype.onRender = function() {
        var end, start, total;
        this.$('.btn').on('click', this.onNavigate);
        start = this.fullCollection.currentPage * this.fullCollection.perPage + 1;
        end = start + this.fullCollection.perPage - 1;
        total = this.fullCollection.length;
        if (end > total) end = total;
        console.log(start, end, total);
        return this.$('#page-status').text("" + start + " - " + end + " of " + total);
      };

      ContentsView.prototype.onNavigate = function(evt) {
        return this[$(evt.target).attr("data-nav")]();
      };

      ContentsView.prototype.first = function() {
        return this.goto(0);
      };

      ContentsView.prototype.last = function() {
        return this.goto(this.fullCollection.maxPage());
      };

      ContentsView.prototype.prev = function() {
        return this.goto(this.fullCollection.currentPage - 1);
      };

      ContentsView.prototype.next = function() {
        return this.goto(this.fullCollection.currentPage + 1);
      };

      ContentsView.prototype.goto = function(page) {
        var max;
        if (page < 0) page = 0;
        max = this.fullCollection.maxPage();
        if (page > max) page = max;
        if (page === this.fullCollection.currentPage) return;
        this.fullCollection.currentPage = page;
        this.collection = this.fullCollection.parse();
        return this.render();
      };

      return ContentsView;

    })(Backbone.Marionette.CompositeView);

  }).call(this);
  
});
window.require.register("views/ContentsView", function(exports, require, module) {
  (function() {
    var ComicsReaderView, ContentsBCView, ContentsMainView, ContentsView, app, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/contents');

    app = require('application');

    ContentsBCView = require('./ContentsBCView');

    ContentsMainView = require('./ContentsMainView');

    ComicsReaderView = require('./ComicsReaderView');

    module.exports = ContentsView = (function(_super) {

      __extends(ContentsView, _super);

      function ContentsView() {
        this.onRender = __bind(this.onRender, this);
        this.initialize = __bind(this.initialize, this);
        ContentsView.__super__.constructor.apply(this, arguments);
      }

      ContentsView.prototype.template = template;

      ContentsView.prototype.regions = {
        breadcrumbs: '#contents-bc',
        main: '#contents-main',
        comics_reader: '#comics-popup'
      };

      ContentsView.prototype.initialize = function() {
        var self,
          _this = this;
        this.item = app.item;
        this.bcView = new ContentsBCView(this.item);
        this.mainView = new ContentsMainView(this.item);
        this.readerView = null;
        self = this;
        this.nickName = "ContentsView";
        return app.vent.on('comics:selected', function(item) {
          var location;
          console.log("" + _this.nickName + ", constructed by " + _this.constructor.name + " responding to app.vent-comics:selected");
          location = "reader.html?page=0&at=" + (item.get('path')) + "&pages=" + (item.get('pages').length);
          window.popup = window.open(location, item.get('name'), 'location=0, directories=0, status=0, menubar=0, resizable=0');
          if (typeof popup.requestFullScreen === "function") {
            popup.requestFullScreen();
          }
          return;
          console.log("Creating a new ComicsReaderView");
          self.readerView = new ComicsReaderView({
            model: item
          });
          console.log("Now to show the recently created ComicsReaderView");
          try {
            self.comics_reader.show(self.readerView);
            return console.log("ComicsReaderView should be shown by now...");
          } catch (e) {
            console.log(e.toString());
            return self.readerView.render();
          }
        });
      };

      ContentsView.prototype.onRender = function(evt) {
        this.breadcrumbs.show(this.bcView);
        return this.main.show(this.mainView);
      };

      return ContentsView;

    })(Backbone.Marionette.Layout);

  }).call(this);
  
});
window.require.register("views/FooterView", function(exports, require, module) {
  (function() {
    var FooterView, template,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/footer');

    module.exports = FooterView = (function(_super) {

      __extends(FooterView, _super);

      function FooterView() {
        FooterView.__super__.constructor.apply(this, arguments);
      }

      FooterView.prototype.template = template;

      return FooterView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/GenericPopupView", function(exports, require, module) {
  (function() {
    var GenericPopupView, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('views/templates/genericpopupview');

    module.exports = GenericPopupView = (function(_super) {

      __extends(GenericPopupView, _super);

      function GenericPopupView() {
        this.render = __bind(this.render, this);
        this.onBtnClick = __bind(this.onBtnClick, this);
        GenericPopupView.__super__.constructor.apply(this, arguments);
      }

      GenericPopupView.prototype.template = template;

      GenericPopupView.prototype.onBtnClick = function(ev) {
        console.log("Clicked on a link");
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        return this.$('div.modal').modal('hide');
      };

      GenericPopupView.prototype.render = function() {
        Backbone.Marionette.ItemView.prototype.render.apply(this, arguments);
        console.log('GenericPopupView render');
        this.$('a').on('click', this.onBtnClick);
        return this.$('div.modal').modal();
      };

      return GenericPopupView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/HomeView", function(exports, require, module) {
  (function() {
    var HomeView, template,
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/home');

    module.exports = HomeView = (function(_super) {

      __extends(HomeView, _super);

      function HomeView() {
        HomeView.__super__.constructor.apply(this, arguments);
      }

      HomeView.prototype.id = 'home-view';

      HomeView.prototype.template = template;

      return HomeView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/ItemListView", function(exports, require, module) {
  (function() {
    var ItemListView, app, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/itemlist');

    app = require('application');

    module.exports = ItemListView = (function(_super) {

      __extends(ItemListView, _super);

      function ItemListView() {
        this.onClick = __bind(this.onClick, this);
        ItemListView.__super__.constructor.apply(this, arguments);
      }

      ItemListView.prototype.template = template;

      ItemListView.prototype.tagName = 'li';

      ItemListView.prototype.className = 'span2';

      ItemListView.prototype.events = {
        'click': 'onClick'
      };

      ItemListView.prototype.onClick = function(evt) {
        var _this = this;
        return this.model.fetch({
          success: function(model, response) {
            var _ref;
            console.log("Item " + (model.get('name')) + " successfully retrieved");
            if ((_ref = model.get('type')) === 'rarfile' || _ref === 'zipfile') {
              model.set('currentPage', 0);
              return app.vent.trigger("comics:selected", model);
            } else {
              return app.vent.trigger("item:selected", model);
            }
          },
          error: function() {
            return bootbox.alert("Warning. Server is not responding, probably down. ;-(");
          }
        });
      };

      return ItemListView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/MenuView", function(exports, require, module) {
  (function() {
    var MenuView, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    template = require('./templates/menu');

    module.exports = MenuView = (function(_super) {

      __extends(MenuView, _super);

      function MenuView() {
        this.highlight = __bind(this.highlight, this);
        this.onRender = __bind(this.onRender, this);
        this.setFakeUser = __bind(this.setFakeUser, this);
        this.submit = __bind(this.submit, this);
        MenuView.__super__.constructor.apply(this, arguments);
      }

      MenuView.prototype.template = template;

      MenuView.prototype.events = {
        'submit': 'submit'
      };

      MenuView.prototype.submit = function(ev) {
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        if (!(this.$('.username-input').val() && this.$('.pwd-input').val())) {
          return false;
        }
        this.setFakeUser({
          username: this.$('.username-input').val(),
          pwd: this.$('.pwd-input').val()
        });
        return false;
      };

      MenuView.prototype.setFakeUser = function(userdata) {
        var _this = this;
        return this.options.dataSource.getUser(userdata.username, userdata.pwd, function(err, user) {
          if (user) {
            return _this.options.vent.trigger('login', user);
          } else {
            return bootbox.alert(err);
          }
        });
      };

      MenuView.prototype.onRender = function() {
        this.highlight({
          href: this.currentRoute
        });
        return this.$('a[href="#newuser"], a[href="#edituser"]').tooltip({
          placement: 'bottom'
        });
      };

      MenuView.prototype.highlight = function(where) {
        this.currentRoute = where.href;
        this.$('ul.nav>li').removeClass('active');
        return this.$("li>a[href='#" + where.href + "']").parent().addClass('active');
      };

      return MenuView;

    })(Backbone.Marionette.ItemView);

  }).call(this);
  
});
window.require.register("views/UserItemView", function(exports, require, module) {
  (function() {
    var GenericPopupView, UserItemView, template,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      __hasProp = Object.prototype.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

    GenericPopupView = require('views/GenericPopupView');

    template = require('views/templates/useritemview');

    module.exports = UserItemView = (function(_super) {

      __extends(UserItemView, _super);

      function UserItemView() {
        this.onBtnClick = __bind(this.onBtnClick, this);
        this.onRender = __bind(this.onRender, this);
        UserItemView.__super__.constructor.apply(this, arguments);
      }

      UserItemView.prototype.template = template;

      UserItemView.prototype.onRender = function(ev) {
        console.log("Custom post-rendering of UserItemView");
        if (this.options.mode === 'insert') {
          return this.$('div.modal-header>h3').text("New User");
        } else if (this.options.mode === 'update') {
          return this.$('div.modal-header>h3').text("Edit user " + (this.model.get('fullname')));
        }
      };

      UserItemView.prototype.onBtnClick = function(ev) {
        var action,
          _this = this;
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        action = '';
        if (ev.target.className.match(/btn-save/)) action = 'save';
        if (ev.target.className.match(/btn-cancel/)) action = 'cancel';
        if (action === 'save') {
          if (!(this.$('#txt-username').val() && this.$('#txt-fullname').val() && this.$('#txt-email').val() && this.$('#txt-pwd').val())) {
            return;
          }
          this.model.set({
            username: this.$('#txt-username').val(),
            fullname: this.$('#txt-fullname').val(),
            email: this.$('#txt-email').val(),
            pwd: this.$('#txt-pwd').val()
          });
          if (this.options.mode === 'insert') {
            this.options.dataSource.insertUser(this.model, function(err, newuser) {
              if (!err) return _this.options.vent.trigger('login', newuser);
            });
          } else if (this.options.mode === 'update') {
            this.options.dataSource.updateUser(this.model.cid, this.model.toJSON(), function(err, user) {
              if (!err) return _this.options.vent.trigger('login', user);
            });
          }
        }
        if (action) return this.$('div.modal').modal('hide');
      };

      return UserItemView;

    })(GenericPopupView);

  }).call(this);
  
});
window.require.register("views/templates/about", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "    \n\n<div class=\"row\">\n  <div class=\"span12\">\n    <div class=\"row pull-right\">\n        <div class=\"span5\"><h3>About Silver Age Comics</h3></div>\n        <div class=\"span1\"><img class=\"img-rounded\" src=\"/legionthumb\"/></div>\n    </div>\n    <div class=\"row\">\n        <div class=\"well\" style=\"padding: 20px;\">\n            <p>\n              All the heroes.\n            </p>\n            <p>\n              All the villains.\n            </p>\n        </div>\n    </div>\n  </div>\n</div>\n\n    ";});
});
window.require.register("views/templates/appLayout", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "\n<div id=\"menu\" class=\"navbar navbar-fixed-top\"></div>\n<div id=\"content\" class=\"container-fluid\"></div>\n<div id=\"footer\"></div>\n<div id=\"popup\"></div>";});
});
window.require.register("views/templates/comicsreaderview", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n                <li data-number=\"";
    stack1 = depth0.real;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.real", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\"><a href=\"#\">";
    stack1 = depth0.shown;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.shown", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</a></li>\n              ";
    return buffer;}

    buffer += "<div class=\"modal hide\" style=\"width: 95%; margin: -50px 0 0 -650px;\">\n  <div class=\"modal-header\" style=\"max-height: 3em;\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n      <h5>";
    foundHelper = helpers.bareName;
    stack1 = foundHelper || depth0.bareName;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "bareName", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</h5>\n  </div>\n  <div class=\"modal-body\" style=\"text-align: center; min-height: 33.5em;\">\n      <img id=\"page-show\" width=\"70%\" height=\"70%\" src=\"page?page=";
    foundHelper = helpers.currentPage;
    stack1 = foundHelper || depth0.currentPage;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentPage", { hash: {} }); }
    buffer += escapeExpression(stack1) + "&at=";
    foundHelper = helpers.path;
    stack1 = foundHelper || depth0.path;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "path", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" class=\"img-polaroid\" />\n  </div>\n  <div class=\"modal-footer\" style=\"padding: 10px; max-height: 4em; overflow: auto;\">\n      <!--<a href=\"#\" class=\"btn btn-cancel\">Cancel</a>\n      <a href=\"#\" class=\"btn btn-primary btn-save\">Save</a>-->\n      <div class=\"row\">\n        <div class=\"pagination\" style=\"font-size: smaller;\">\n          <ul>\n              <li><a href=\"#\">First</a></li>\n              <li><a href=\"#\">Prev</a></li>\n              <li><a href=\"#\">Next</a></li>\n              <li><a href=\"#\">Last</a></li>\n              <span class=\"divider\">&nbsp;&nbsp;</span>\n              <li><a href=\"#\">+</a></li>\n              <li><a href=\"#\">-</a></li>\n              <span class=\"divider\">&nbsp;&nbsp;</span>\n              ";
    foundHelper = helpers.pageNumbers;
    stack1 = foundHelper || depth0.pageNumbers;
    stack2 = helpers.each;
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n          </ul>\n        </div>\n    </div>\n  </div>\n</div>";
    return buffer;});
});
window.require.register("views/templates/contents", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "\n<div class=\"row\" id=\"contents-bc\">\n    BreadCrumbs\n</div>\n\n<div class=\"row\" id=\"contents-main\">\n    Main Contents\n</div>\n\n<div id=\"comics-popup\">\n\n</div>\n";});
});
window.require.register("views/templates/contents_bc", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1, stack2;
    buffer += "\n                <li>\n                    <a href=\"#\" data-path=\"";
    stack1 = depth0.path;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.path", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\">\n                        ";
    stack1 = depth0.name;
    stack2 = helpers['if'];
    tmp1 = self.program(2, program2, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(4, program4, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n                    </a>\n                </li>\n                <span class=\"divider\"> / </span>\n            ";
    return buffer;}
  function program2(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n                          ";
    stack1 = depth0.name;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.name", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\n                        ";
    return buffer;}

  function program4(depth0,data) {
    
    
    return "\n                        <strong>Silver Age Comics Library</strong>\n                        ";}

    buffer += "    <div class=\"span12\" style=\"font-size: small; width: 95%;\">\n        <div class=\"well-small\">\n            <ul class=\"breadcrumb\">\n            ";
    foundHelper = helpers.ancestryObjs;
    stack1 = foundHelper || depth0.ancestryObjs;
    stack2 = helpers.each;
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n            </ul>\n        </div>\n    </div>\n\n";
    return buffer;});
});
window.require.register("views/templates/contents_main", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "  <div class=\"row-fluid\" style=\"overflow: auto; padding-left: 1em; margin-top: 0px;\">\n    <ul id=\"dir-list\" class=\"thumbnails\">\n    </ul>\n  </div>\n  <div class=\"row\">\n    <div class=\"span4 offset6\">\n        <div class=\"btn-group\">\n          <button class=\"btn\" data-nav=\"first\">First</button>\n          <button class=\"btn\" data-nav=\"prev\">Previous</button>\n        <!--</div>-->\n        <button style=\"border: 1px solid; border-radius: 3px; padding: 5px; border-color: #888888; font-size: 10px;\" id=\"page-status\">-</button>\n        <!--<div class=\"btn-group\">-->\n          <button class=\"btn\" data-nav=\"next\">Next</button>\n          <button class=\"btn\" data-nav=\"last\">Last</button>\n        </div>\n    </div>\n  </div>\n";});
});
window.require.register("views/templates/footer", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "\n<footer class=\"navbar-fixed-bottom\" style=\"border-top: solid 1px; padding-top: 0.5em; padding-bottom: 0.5em; color: #666666; border-color: #cccccc;\">\n    <div class=\"container\">\n      <span>\n        <a href=\"http://silveragecomics.ods.org\">Silver Age Comics</a> powered by \n        <a target=\"_blank\" href=\"https://github.com/sandy98/brunch-with-puppets#brunch-with-puppets\">Brunch with Puppets</a> \n      </span>\n      <img id=\"ajax-loader\" src=\"img/spinner.gif\" style=\"display: none; position: absolute; bottom: 40px; right: 20px; z-index: 1000;\"/>\n    </div>\n</footer>";});
});
window.require.register("views/templates/genericpopupview", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


    buffer += "<div class=\"modal hide fade\">\n  <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n      <h3>";
    foundHelper = helpers.title;
    stack1 = foundHelper || depth0.title;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</h3>\n  </div>\n  <div class=\"modal-body\">\n      <p>";
    foundHelper = helpers.message;
    stack1 = foundHelper || depth0.message;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "message", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</p>\n  </div>\n  <div class=\"modal-footer\">\n      <a href=\"#\" class=\"btn\">Close</a>\n      <a href=\"#\" class=\"btn btn-primary\">OK</a>\n  </div>\n</div>";
    return buffer;});
});
window.require.register("views/templates/home", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "    \n\n<div class=\"row\">\n  <div class=\"span12\">\n    <div class=\"well\">\n      <h3>Comics Home</h3>\n    </div>\n    <div class=\"row\">\n      <div class=\"span4 offset4\" style=\"text-align: center;\">\n        <img class=\"img-polaroid\" src=\"/legionthumb\" width=\"50%\" height=\"50%\"/>\n      </div>\n    </div>\n    <div class=\"row\">\n      <div style=\"margin-top: 0.5em; font-size: small;\">\n        <p>\n          Right now, you can login using the facade data source system, using any of the built-in users as seen below.\n        </p>\n        <p>\n          Or just simply sign up as a new user. Just keep in mind that any changes you make will be lost as soon as you leave the app\n          because they are not being recorded to a database, this is only a mockup. The real thing is left to you...\n        </p>\n        <p>\n          <ul class=\"breadcrumb\">\n            <li>\n              <span style=\"color: #880000;\">username: </span>\n              <span style=\"color: #3C84CC;\">lar-gand</span>\n              <span style=\"color: #880000;\">pwd: </span>\n              <span style=\"color: #3C84CC;\">daxamite</span>\n            </li>\n            <span class=\"divider\">&nbsp;/&nbsp;</span>\n            <li>\n              <span style=\"color: #880000;\">username: </span>\n              <span style=\"color: #3C84CC;\">kal-el</span>\n              <span style=\"color: #880000;\">pwd: </span>\n              <span style=\"color: #3C84CC;\">kriptonian</span>\n            </li>\n            <span class=\"divider\">&nbsp;/&nbsp;</span>\n            <li>\n              <span style=\"color: #880000;\">username: </span>\n              <span style=\"color: #3C84CC;\">rokk-krinn</span>\n              <span style=\"color: #880000;\">pwd: </span>\n              <span style=\"color: #3C84CC;\">braalian</span>\n            </li>\n          </ul>\n        </p>\n      </div>\n    </div>\n  </div>\n</div>\n\n    ";});
});
window.require.register("views/templates/itemlist", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    
    return "\n    <img src=\"supi_folder\" width=\"100%\" height=\"100%\"/>\n  ";}

  function program3(depth0,data) {
    
    var buffer = "", stack1, stack2;
    buffer += "\n    ";
    foundHelper = helpers.isComic;
    stack1 = foundHelper || depth0.isComic;
    stack2 = helpers['if'];
    tmp1 = self.program(4, program4, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n  ";
    return buffer;}
  function program4(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n      <img class=\"img-polaroid\" src=\"page?page=0&at=";
    foundHelper = helpers.path;
    stack1 = foundHelper || depth0.path;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "path", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" width=\"100%\" height=\"100%\" />\n    ";
    return buffer;}

    buffer += "<a class=\"thumbnail\" style=\"margin-bottom: 5px; font-size: smaller;\" href=\"#contents\" data-path=\"";
    foundHelper = helpers.path;
    stack1 = foundHelper || depth0.path;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "path", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\">\n  ";
    foundHelper = helpers.isDirectory;
    stack1 = foundHelper || depth0.isDirectory;
    stack2 = helpers['if'];
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(3, program3, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n  ";
    foundHelper = helpers.name;
    stack1 = foundHelper || depth0.name;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\n</a>";
    return buffer;});
});
window.require.register("views/templates/menu", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n        <ul class=\"nav nav-pills pull-right\">\n            <li><a style=\"color: #ff4400;\" href=\"#edituser\" title=\"Edit user data\">";
    foundHelper = helpers.fullname;
    stack1 = foundHelper || depth0.fullname;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fullname", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</a></li>\n            <li><a href=\"#dologout\">Sign out</a></li>\n        </ul>\n        ";
    return buffer;}

  function program3(depth0,data) {
    
    
    return "\n        <ul class=\"nav pull-right\">\n            <li><a href=\"#newuser\" title=\"Become a member\">Sign up</a></li>\n        </ul>\n        <form class=\"navbar-form pull-right\">\n            <input class=\"span2 username-input\" type=\"text\" placeholder=\"username or email\" required=\"required\">\n            <input class=\"span2 pwd-input\" type=\"password\" placeholder=\"password\" required=\"required\">\n            <button type=\"submit\" class=\"btn btn-small\">Sign in</button>\n        </form>\n        ";}

    buffer += "  <div class=\"navbar-inner\">\n    <div class=\"container\">\n      <a class=\"btn btn-navbar\" data-toggle=\"collapse\" data-target=\".nav-collapse\">\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n      </a>\n      <a class=\"brand\" href=\"#\">Silver Age Comics</a>\n      <div class=\"nav-collapse collapse\">\n        <ul class=\"nav\">\n          <li><a href=\"#\">Home</a></li>\n          <li><a href=\"#contents\">Comics Library</a></li>\n          <li><a href=\"#about\">About</a></li>\n        </ul>\n\n        ";
    foundHelper = helpers.username;
    stack1 = foundHelper || depth0.username;
    stack2 = helpers['if'];
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(3, program3, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n        \n      </div>\n    </div>\n  </div>\n";
    return buffer;});
});
window.require.register("views/templates/useritemview", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


    buffer += "<div class=\"modal hide fade\">\n  <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n      <h3></h3>\n  </div>\n  <div class=\"modal-body\">\n    <form class=\"form-horizontal well well-shadow\">\n      <fieldset>\n        <legend>User Data</legend>\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"txt-username\">Username</label>\n          <div class=\"controls\">\n            <input type=\"text\" placeholder=\"username\" id=\"txt-username\" value=\"";
    foundHelper = helpers.username;
    stack1 = foundHelper || depth0.username;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "username", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" />\n          </div>\n        </div>\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"txt-fullname\">Full Name</label>\n          <div class=\"controls\">\n            <input type=\"text\" placeholder=\"full name\" id=\"txt-fullname\" value=\"";
    foundHelper = helpers.fullname;
    stack1 = foundHelper || depth0.fullname;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fullname", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" />\n          </div>\n        </div>\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"txt-email\">eMail</label>\n          <div class=\"controls\">\n            <input type=\"text\" placeholder=\"email\" id=\"txt-email\" value=\"";
    foundHelper = helpers.email;
    stack1 = foundHelper || depth0.email;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "email", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" />\n          </div>\n        </div>\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"txt-pwd\">Password</label>\n          <div class=\"controls\">\n            <input type=\"password\" placeholder=\"password\" id=\"txt-pwd\" value=\"";
    foundHelper = helpers.pwd;
    stack1 = foundHelper || depth0.pwd;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pwd", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" />\n          </div>\n        </div>\n      </fieldset>\n    </form>\n  </div>\n  <div class=\"modal-footer\">\n      <a href=\"#\" class=\"btn btn-cancel\">Cancel</a>\n      <a href=\"#\" class=\"btn btn-primary btn-save\">Save</a>\n  </div>\n</div>";
    return buffer;});
});
