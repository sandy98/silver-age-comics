// GOSenerated by CoffeeScript 1.12.4
(function() {
  var MAX_CACHE_SIZE, RarFile, Router, USE_CACHE, ZipFile, _, argv, async, clean_up, comics_lister, contentsDir, fs, getComicAt, getDirAt, getItemAt, gm, http, img_cache, isRarFile, os, path, pid, portnum, readCachePages, readComicsPage, readRarFile, readRarPages, readZipFile, readZipPages, rootDir, router, server,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  require('systemd');

  require('autoquit');

  fs = require('graceful-fs');

  path = require('path');

  os = require('os');

  http = require('http');

  async = require('async');

  Router = require('node-simple-router');

  gm = require('gm').subClass({
    imageMagick: true
  });

  ZipFile = require('adm-zip');

  RarFile = require('rarfile').RarFile;

  isRarFile = require('rarfile').isRarFile;

  _ = require('underscore')._;

  comics_lister = require("./comics_lister.js");

  process.chdir(__dirname);

  router = Router({
    list_dir: false
  });

  server = http.createServer(router);

  router._404 = function(req, res, path) {
    var custom404;
    custom404 = fs.createReadStream("./public/404.html");
    res.writeHead(404, {
      "ContentType": "text/html"
    });
    return custom404.pipe(res);
  };


  /*
  process.on 'uncaughtException', (err) ->
    if err.code is "EMFILE"
      console.log "Pesky 'Too many files open' strikes again.\nFailure was set after #{readRarPages} read RAR pages."
      console.log ("=" for x in [0..79]).join ''
      console.log "STACK TRACE"
      console.log ("=" for x in [0..79]).join ''
      console.log err.stack
      console.log ("=" for x in [0..79]).join ''
    else
      console.error("ANOTHER KIND OF UNCAUGHT ERROR: #{err.toString()}")
      console.log("Node NOT Exiting...")
   */

  USE_CACHE = true;

  MAX_CACHE_SIZE = 100;

  img_cache = {};

  readRarPages = 0;

  readZipPages = 0;

  readCachePages = 0;

  rootDir = "/home/ernesto/tera/programas/git-projects/propios/silvercomics" + path.sep;

  contentsDir = rootDir + "contents" + path.sep;

  readComicsPage = function(comic, page, cb) {
    var e, fullpath, func, tool;
    fullpath = "" + contentsDir + comic.path;
    try {
      switch (comic.type) {
        case 'rarfile':
          tool = new RarFile(fullpath);
          func = tool.readFile;
          return func(comic.pages[page], function(err, data) {
            readRarPages += 1;
            return cb(err, data);
          });
        case 'zipfile':
          tool = new ZipFile(fullpath);
          func = tool.readFileAsync;
          return func(comic.pages[page], function(data) {
            readZipPages += 1;
            return cb(null, data);
          });
        case 'directory':
          return cb(new Error("Can't read pages from a directory."), null);
        default:
          return cb(new Error("Tried to read an unknown source"), null);
      }
    } catch (error) {
      e = error;
      return cb(e, null);
    }
  };

  readRarFile = function(comic, fullpath, cb) {
    var rf;
    rf = new RarFile(fullpath);
    return rf.on('ready', function() {
      var f;
      comic.pages = ((function() {
        var i, len, ref, ref1, results1;
        ref = rf.names;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          f = ref[i];
          if ((ref1 = path.extname(f).toLowerCase()) === '.jpg' || ref1 === '.jpeg' || ref1 === '.gif' || ref1 === '.png' || ref1 === '.bmp' || ref1 === '.tiff') {
            results1.push(f);
          }
        }
        return results1;
      })()).sort()
      comic.size = comic.pages.length;
      return cb(null, comic);
    });
  };

  readZipFile = function(comic, fullpath, cb) {
    var n, zf;
    zf = new ZipFile(fullpath);
    comic.pages = ((function() {
      var i, len, ref, ref1, results1;
      ref = zf.getEntries();
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        n = ref[i];
        if ((ref1 = path.extname(n.name).toLowerCase()) === '.jpg' || ref1 === '.jpeg' || ref1 === '.gif' || ref1 === '.png' || ref1 === '.bmp' || ref1 === '.tiff') {
          results1.push(n.entryName);
        }
      }
      return results1;
    })()).sort()
    comic.size = comic.pages.length;
    return cb(null, comic);
  };

  getItemAt = function(at, cb) {
    var fullpath, ref;
    fullpath = "" + contentsDir + (at.trim());
    if (!((ref = path.extname(fullpath).toLowerCase()) === '.cbr' || ref === '.cbz' || ref === '.rar' || ref === '.zip')) {
      return getDirAt(at, fullpath, cb);
    }
    return getComicAt(at, fullpath, cb);
  };

  getComicAt = function(at, fullpath, cb) {
    var comic;
    comic = {
      name: path.basename(at.trim()),
      path: at.trim()
    };
    switch (path.extname(at.trim()).toLowerCase()) {
      case '.cbr':
      case '.rar':
        if (isRarFile(fullpath)) {
          comic.type = 'rarfile';
          return readRarFile(comic, fullpath, cb);
        } else {
          comic.type = 'zipfile';
          return readZipFile(comic, fullpath, cb);
        }
        break;
      case '.cbz':
      case '.zip':
        comic.type = 'zipfile';
        return readZipFile(comic, fullpath, cb);
      default:
        comic.type = 'unknown';
        return cb(new Error('Unknown file type'), null);
    }
  };

  getDirAt = function(at, fullpath, cb) {
    var directory;
    directory = {
      name: path.basename(at),
      path: at,
      type: 'directory'
    };
    return async.waterfall([
      function(callb) {
        return fs.readdir(fullpath, function(err, direntries) {
          if (err) {
            return callb(err);
          }
          return callb(null, direntries);
        });
      }, function(direntries, callb) {
        var fullpaths, item, items;
        items = (function() {
          var i, len, results1;
          results1 = [];
          for (i = 0, len = direntries.length; i < len; i++) {
            item = direntries[i];
            results1.push({
              name: item,
              path: "" + (at.trim()) + path.sep + item
            });
          }
          return results1;
        })();
        fullpaths = (function() {
          var i, len, results1;
          results1 = [];
          for (i = 0, len = direntries.length; i < len; i++) {
            item = direntries[i];
            results1.push("" + fullpath + path.sep + item);
          }
          return results1;
        })();
        return async.series([
          function(scb) {
            return async.mapSeries(fullpaths, fs.stat, function(err, stats) {
              return scb(err, stats);
            });
          }, function(scb) {
            var i, len;
            for (i = 0, len = items.length; i < len; i++) {
              item = items[i];
              switch (path.extname(item.name).toLowerCase()) {
                case '.cbr':
                case '.rar':
                  if (isRarFile("" + fullpath + path.sep + item.name)) {
                    item.type = 'rarfile';
                  } else {
                    item.type = 'zipfile';
                  }
                  break;
                case '.cbz':
                case '.zip':
                  item.type = 'zipfile';
                  break;
                default:
                  item.type = 'unknown';
              }
            }
            return scb(null, items);
          }
        ], function(err, collections) {
          var comics, directories, i, n, ref, ref1, stats;
          if (err) {
            console.log("getDirAt - Step 2bc: ERRORRR " + (err.toString()) + "\n");
            return callb(err);
          } else {
            ref = [collections[0], collections[1]], stats = ref[0], items = ref[1];
            for (n = i = 0, ref1 = stats.length; 0 <= ref1 ? i < ref1 : i > ref1; n = 0 <= ref1 ? ++i : --i) {
              if (stats[n].isDirectory()) {
                items[n].type = "directory";
              }
            }
            directories = items.filter(function(item) {
              return item.type === 'directory';
            });
            comics = items.filter(function(item) {
              return item.type !== 'directory';
            });
            return callb(null, directories.concat(comics));
          }
        });
      }, function(items, callb) {
        return async.filterSeries(items, function(item, callb2) {
          return callb2(item.type !== 'unknown');
        }, function(results) {
          return callb(null, results);
        });
      }
    ], function(err, results) {
      if (err) {
        console.log("getDirAt - Final Step: ERRORRR " + (err.toString()) + "\n");
        return cb(err);
      } else {
        directory.files = results;
        return cb(null, directory);
      }
    });
  };

  router.get("/zoompage", function(req, res) {
    var at, err, page, zoom;
    try {
      at = unescape(req.get.at).trim();
      page = parseInt(req.get.page);
      zoom = req.get.zoom;
      return getItemAt(at, function(err, comic) {
        if (err) {
          res.writeHead(301, {
            "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
          });
          return res.end();
        }
        return readComicsPage(comic, page, function(err, data) {
          var buffer, file, height, new_height, new_width, ref, width;
          if (err) {
            res.writeHead(301, {
              "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
            });
            
            return res.end();
          }
          buffer = data;
          if (buffer.length) {
            return gm(buffer, 'zoomed_thumb.jpg').resize(zoom + "%", zoom + "%").stream().pipe(res);
            file = magick.identify({
              srcData: buffer
            });
            ref = [file.width, file.height], width = ref[0], height = ref[1];
            new_width = parseInt(width) * zoom / 100;
            new_height = parseInt(height) * zoom / 100;
            buffer = magick.convert({
              srcData: buffer,
              width: new_width,
              height: new_height
            });
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(buffer);
          } else {
            res.writeHead(301, {
              "Location": "http://placehold.it/1600x200.png/ffffffff&text=Request resulted in 0 length page"
            });
            return res.end();
          }
        });
      });
    } catch (error) {
      err = error;
      res.writeHead(301, {
        "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
      });
      return res.end();
    }
  });

  router.get("/page", function(req, res) {
    var at, buffer, err, page;
    try {
      if (JSON.stringify(req.get) in img_cache) {
        buffer = img_cache[JSON.stringify(req.get)];
        res.write(buffer);
        readCachePages += 1;
        console.log(("Written image from cache, which is now " + (_.keys(img_cache).length) + " long").toUpperCase());
        return res.end();
      }
      at = unescape(req.get.at).trim();
      page = parseInt(req.get.page);
      return getItemAt(at, function(err, comic) {
        if (err) {
          res.writeHead(301, {
            "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
          });
          return res.end();
        }
        return readComicsPage(comic, page, function(err, data) {
          if (err) {
            res.writeHead(301, {
              "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
            });
            return res.end();
          }
          if (data.constructor.name === 'String') {
            buffer = new Buffer(data, 'binary');
          } else {
            buffer = data;
          }
          if (req.get.format === 'string') {
            buffer = escape(buffer.toString('binary'));
          }
          if (buffer.length) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.write(buffer);
            res.end();
            if (USE_CACHE) {
              if (_.keys(img_cache).length >= MAX_CACHE_SIZE) {
                console.log("Making room in cache...");
                delete img_cache[_.keys(img_cache)[0]];
              }
              img_cache[JSON.stringify(req.get)] = buffer;
              return console.log(((JSON.stringify(req.get)) + " included in image cache.").toUpperCase());
            }
          } else {
            res.writeHead(301, {
              "Location": "http://placehold.it/1600x200.png/ffffffff&text=Request resulted in 0 length page"
            });
            return res.end();
          }
        });
      });
    } catch (error) {
      err = error;
      res.writeHead(301, {
        "Location": "http://placehold.it/1600x200.png/ffffffff&text=" + err.message
      });
      return res.end();
    }
  });

  router.any("/item", function(req, res) {
    var at, err, jsonData;
    try {
      at = req.get.at ? unescape(req.get.at) : '';
      return getItemAt(unescape(at), function(err, data) {
        if (err) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(500, {
            "ContentType": "text/plain"
          });
          return res.end(err.toString());
        } else {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(200, {
            "ContentType": "text/x-json"
          });
          jsonData = JSON.stringify(data)
          console.log('Item requested:\n', jsonData)
          return res.end(jsonData);
        }
      });
    } catch (error) {
      err = error;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(500, {
        "ContentType": "text/plain"
      });
      return res.end(err.toString());
    }
  });

  router.get("/statistics", function(req, res) {
    var cacheMax, cacheStats, cacheUse;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      "ContentType": "text/x-json"
    });
    cacheMax = MAX_CACHE_SIZE;
    cacheUse = _.keys(img_cache).length;
    cacheStats = {
      cacheUse: cacheUse,
      cacheMax: cacheMax
    };
    return res.end(JSON.stringify({
      readRarPages: readRarPages,
      readZipPages: readZipPages,
      readCachePages: readCachePages,
      cacheStats: cacheStats
    }));
  });


  /*
  router.get "/legionthumb", (req, res) ->
    option = Math.ceil(Math.random() * 3)
    res.writeHead 200, "ContentType": "image/jpeg"
    #thumb = gm(fs.createReadStream("#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}legion.jpg"), 'legion.jpg')
    fs.readFile "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}legion.jpg", (err, data) ->
      thumb = new magick.File(data)
      if option is 1
        thumb.sepia()
      if option is 2
        #thumb.type('grayscale')
        thumb.charcoal()
      newdata = thumb.getBuffer()
      thumb.release()
      #thumb.stream().pipe res
      res.end newdata
   */

  router.get("/legionthumb_old", function(req, res) {
    var file, option;
    option = Math.ceil(Math.random() * 2);
    file = "";
    switch (option) {
      case 2:
        file = "Supergirls_40.png";
        break;
      default:
        file = "legion_20.jpg";
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(307, {
      "Location": "img/" + file
    });
    return res.end();
  });

  router.get("/legionthumb", function(req, res) {
    var candidates, mycb;
    mycb = function(comics) {
      var file, selected;
      selected = Math.floor(Math.random() * comics.length);
      file = comics[selected].file.replace(/.+contents\//, '');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200, {
        "Content-Type": "text/plain"
      });
      return res.end(file);
    };
    candidates = ['Adventure Comics', 'Action Comics', 'Superman', 'Superboy', 'Supergirl', 'Batman'];
    return comics_lister("" + contentsDir + candidates[Math.floor(Math.random() * candidates.length)], mycb);
  });

  router.get("/thumb", function(req, res) {
    var image, size, thumb;
      res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      "ContentType": "image/jpeg"
    });
    size = 200;
    image = 'supes_logo_blue_bg.jpg';
    thumb = gm(fs.createReadStream("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image), 'thumb.png');
    return thumb.resize(size + "%", size + "%").antialias().stream().pipe(res);
    return fs.readFile("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image, function(err, data) {
      var f, height, new_height, new_width, ref, width;
      f = magick.identify({
        srcData: data
      });
      ref = [f.width, f.height], width = ref[0], height = ref[1];
      new_width = parseInt(width) * size / 100;
      new_height = parseInt(height) * size / 100;
      data = magick.convert({
        srcData: data,
        width: new_width,
        height: new_height
      });
      return res.end(data);
    });
  });

  router.get("/thumb/:image/:proportion", function(req, res) {
    var image, size, thumb;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      "ContentType": "image/jpeg"
    });
    size = req.params.proportion || 100;
    image = "" + req.params.image;
    if (fs.existsSync("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image + ".jpg")) {
      image = image + ".jpg";
    } else if (fs.existsSync("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image + ".png")) {
      image = image + ".png";
    } else if (fs.existsSync("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image + ".gif")) {
      image = image + ".gif";
    } else if (fs.existsSync("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image + ".ico")) {
      image = image + ".ico";
    } else if (fs.existsSync("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image + ".bmp")) {
      image = image + ".bmp";
    } else {
      image = 'supes_logo_blue_bg.jpg';
    }
    console.log("Displaying thumb " + image);
    thumb = gm(fs.createReadStream("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image), image);
    return thumb.resize(size + "%", size + "%").antialias().stream().pipe(res);
    return fs.readFile("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image, function(err, data) {
      var f, height, new_height, new_width, ref, width;
      f = magick.identify({
        srcData: data
      });
      ref = [f.width, f.height], width = ref[0], height = ref[1];
      new_width = parseInt(width) * size / 100;
      new_height = parseInt(height) * size / 100;
      data = magick.convert({
        srcData: data,
        width: new_width,
        height: new_height
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.end(data);
    });
  });

  router.get("/supi_folder", function(req, res) {
    var image, size, thumb;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      "ContentType": "image/jpeg"
    });
    image = 'superman-192x108.jpg';
    fs.createReadStream("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image).pipe(res);
    size = 10;
    thumb = gm(fs.createReadStream("" + __dirname + path.sep + "public" + path.sep + "img" + path.sep + image), 'thumb.ico');
    return thumb.resize(size + "%", size + "%").antialias().stream().pipe(res);
  });

  router.get("/hello", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.end('Hello, World!, Hola, Mundo!');
  });

  router.get("/visitors", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      'Content-type': 'text/plain'
    });
    return fs.readFile("" + __dirname + path.sep + "data" + path.sep + "visits.txt", "utf8", function(err, data) {
      var visits;
      if (err) {
        return res.end(err.toString());
      } else {
        visits = (parseInt(data) + 1).toString();
        return fs.writeFile("" + __dirname + path.sep + "data" + path.sep + "visits.txt", visits, function(err) {
          if (err) {
            return res.end(err.message);
          } else {
            return res.end(visits);
          }
        });
      }
    });
  });

  router.get("/cookie", function(req, res) {
    var ref;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return res.end(((ref = req.headers.cookie) != null ? ref.toString() : void 0) || "No cookies");
  });

  router.get("/styles", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return async.waterfall([
      function(cb) {
        return fs.readdir("" + __dirname + path.sep + "public" + path.sep + "stylesheets", function(err, files) {
          if (!err) {
            return cb(null, files);
          }
          return cb(err);
        });
      }, function(files, cb) {
        return cb(null, files.filter(function(file) {
          return path.extname(file) === '';
        }));
      }, function(files, cb) {
        return async.map(files, (function(file, map_cb) {
          return map_cb(null, "" + __dirname + path.sep + "public" + path.sep + "stylesheets" + path.sep + file);
        }), function(err, full_names) {
          if (!err) {
            return cb(null, files, full_names);
          }
          return cb(err);
        });
      }, function(files, full_names, cb) {
        return async.map(full_names, fs.stat, function(err, stats) {
          if (err) {
            return cb(err);
          } else {
            return cb(null, files, full_names, stats);
          }
        });
      }, function(files, full_names, stats, cb) {
        var file, file_objs, i, index, len;
        file_objs = [];
        for (index = i = 0, len = files.length; i < len; index = ++i) {
          file = files[index];
          file_objs.push({
            file: files[index],
            fullName: full_names[index],
            stat: stats[index]
          });
        }
        return async.filter(file_objs, (function(obj, filter_cb) {
          return filter_cb(obj.stat.isDirectory());
        }), function(dir_objs) {
          return cb(null, dir_objs);
        });
      }, function(dir_objs, cb) {
        return async.filter(dir_objs, function(obj, filter_cb) {
          return fs.readdir(obj.fullName, function(err, contents) {
            var bResult, e;
            if (err) {
              return filter_cb(false);
            } else {
              try {
                bResult = (indexOf.call(contents, 'bootstrap.min.css') >= 0) ? true : false;
                return filter_cb(bResult);
              } catch (error) {
                e = error;
                return filter_cb(false);
              }
            }
          });
        }, function(dir_objs) {
          return cb(null, dir_objs);
        });
      }
    ], function(err, directories) {
      var i, len, obj, results;
      if (err) {
        return res.end(err.toString());
      } else {
        results = [];
        for (i = 0, len = directories.length; i < len; i++) {
          obj = directories[i];
          results.push({
            value: obj.file,
            text: "" + (obj.file.charAt(0).toUpperCase()) + (obj.file.substring(1))
          });
        }
        return res.end(JSON.stringify(results));
      }
    });
  });

  argv = process.argv.slice(2);

  server.on('listening', function() {
    var addr;
    addr = server.address() || {
      address: '0.0.0.0',
      port: argv[0] || 20386
    };
    return router.log("Serving web content at " + addr.address + ":" + addr.port + " - PID: " + process.pid);
  });

  clean_up = function() {
    console.log("Shutting Up Silver Age Comics Web Server...");
    server.close();
    return process.exit(0);
  };

  process.on("SIGINT", clean_up);

  process.on("SIGQUIT", clean_up);

  process.on("SIGHUP", clean_up);

  process.on("SIGTERM", clean_up);

  pid = process.pid.toString();

  portnum = (argv[0] != null) && !isNaN(parseInt(argv[0])) ? parseInt(argv[0]) : 20386;

  server.listen(20386);

}).call(this);
