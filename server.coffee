#!/usr/bin/env coffee

#
#Requires
#

fs = require 'graceful-fs'
path = require 'path'
os = require 'os'
http = require 'http'
#_when = require 'when'
async = require 'async'
Router = require 'node-simple-router'
gm = require 'gm'
ZipFile = require 'adm-zip'
RarFile = require('rarfile').RarFile
isRarFile = require('rarfile').isRarFile 
_ = require('underscore')._

#
#End of requires
#

#
#Main objects definitions
#


router = Router(list_dir: false)
server = http.createServer router

router._404 = (req, res, path) ->
  custom404 = fs.createReadStream "./public/404.html"
  res.writeHead 404, "ContentType": "text/html"
  custom404.pipe res

#
#End of main objects definitions
#

 
#
#Auxiliary functions and definitions
#

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
  
USE_CACHE = true
MAX_CACHE_SIZE = 100

img_cache = {}
readRarPages = 0
readZipPages = 0
readCachePages = 0

#rootDir = "#{__dirname}#{path.sep}"
rootDir = "/home/ernesto/Dropbox/programas/amecro/www/silvercomics#{path.sep}"
contentsDir = "#{rootDir}contents#{path.sep}"

readComicsPage = (comic, page, cb) ->
  fullpath = "#{contentsDir}#{comic.path}"
  try
    switch comic.type
      when 'rarfile'
        tool = new RarFile fullpath
        func = tool.readFile
        func comic.pages[page], (err, data) ->
          readRarPages += 1
          cb err, data
      when 'zipfile'
        tool = new ZipFile fullpath
        func = tool.readFileAsync
        func comic.pages[page], (data) ->
          readZipPages += 1
          cb null, data
      when 'directory'
        cb new Error("Can't read pages from a directory."), null 
      else
        cb new Error("Tried to read an unknown source"), null
  catch e
    cb e, null

readRarFile = (comic, fullpath, cb) ->
  rf = new RarFile fullpath
  rf.on 'ready', ->
    comic.pages = (f for f in rf.names when path.extname(f).toLowerCase() in ['.jpg', '.jpeg', '.gif', '.png', '.bmp', '.tiff']).sort()
    cb null, comic
  
readZipFile = (comic, fullpath, cb) ->
  zf = new ZipFile fullpath
  comic.pages = (n.entryName for n in zf.getEntries() when path.extname(n.name).toLowerCase() in ['.jpg', '.jpeg', '.gif', '.png', '.bmp', '.tiff']).sort()
  cb null, comic
  
getItemAt = (at, cb) ->
  fullpath = "#{contentsDir}#{at.trim()}"
  #console.log "Requested full path: #{fullpath}"
  return getDirAt at, fullpath, cb unless !!(path.extname(fullpath).toLowerCase() in ['.cbr', '.cbz', '.rar', '.zip'])
  getComicAt at, fullpath, cb
  
getComicAt = (at, fullpath, cb) ->
  comic = name: path.basename(at.trim()), path: at.trim()
  switch path.extname(at.trim()).toLowerCase()
    when '.cbr', '.rar'
      if isRarFile(fullpath) 
        comic.type = 'rarfile'
        return readRarFile comic, fullpath, cb
      else
        comic.type = 'zipfile'
        return readZipFile comic, fullpath, cb
    when '.cbz', '.zip'
      comic.type = 'zipfile'
      return readZipFile comic, fullpath, cb
    else
      comic.type = 'unknown'
      return cb new Error('Unknown file type'), null
        
getDirAt = (at, fullpath, cb) ->
  directory = name: path.basename(at), path: at, type: 'directory'
  async.waterfall [
    (callb) ->
      fs.readdir fullpath, (err, direntries) ->
        return callb(err) if err
        #console.log "getDirAt - Step 1: #{JSON.stringify(direntries)}\n"
        return callb(null, direntries)
    (direntries, callb) ->
      items = (name: item, path: "#{at.trim()}#{path.sep}#{item}" for item in direntries)
      fullpaths = ("#{fullpath}#{path.sep}#{item}" for item in direntries)
      #console.log "getDirAt - Step 2a: #{JSON.stringify(items)}\n"
      async.series [
        (scb) ->
          #console.log "getDirAt - Step 2b: going to map #{fullpaths.length} direntries to its stats\n" 
          async.mapSeries(fullpaths, fs.stat, (err, stats) -> scb(err, stats))
        (scb) ->
          for item in items
            switch path.extname(item.name).toLowerCase()
              when '.cbr', '.rar'
                if isRarFile("#{fullpath}#{path.sep}#{item.name}")
                  item.type = 'rarfile'
                else
                  item.type = 'zipfile'
              when '.cbz', '.zip'
                item.type = 'zipfile'
              else
                item.type = 'unknown'
            #console.log "getDirAt - Step 2b: #{item.name} is a #{item.type}\n"
          scb null, items
      ],
      (err, collections) ->
        if err
          console.log "getDirAt - Step 2bc: ERRORRR #{err.toString()}\n"
          callb err
        else
          #console.log "getDirAt - Step 2bc: got #{collections.length} collections\n"
          [stats, items] = [collections[0], collections[1]]
          for n in [0...stats.length]
            if stats[n].isDirectory()
              items[n].type = "directory"
          callb null, items
        
    (items, callb) ->
      async.filterSeries(
        items
        (item, callb2) -> callb2(item.type isnt 'unknown')
        (results) -> 
          #console.log "getDirAt - Step 3: #{JSON.stringify(results)}\n"
          callb null, results
      )
  ], 
  (err, results) ->
     if err
       console.log "getDirAt - Final Step: ERRORRR #{err.toString()}\n"
       cb err
     else
       #console.log "getDirAt - Final Step: #{JSON.stringify(results)}\n"
       directory.files = results
       cb null, directory


#
#End of auxiliary functions and definitions
#  

  
#
#Routes
#

router.get "/page", (req, res) ->
  try
    #console.log "GET STRINGIFIED #{JSON.stringify req.get}"
    #console.log "Cache length: #{_.keys(img_cache).length}"
    if JSON.stringify(req.get) of img_cache
       buffer = img_cache[JSON.stringify(req.get)]
       res.write buffer
       readCachePages += 1
       console.log "Written image from cache, which is now #{_.keys(img_cache).length} long".toUpperCase()
       return res.end()
    at = unescape(req.get.at).trim()
    page = parseInt req.get.page
    getItemAt at, (err, comic) ->
      if err
        res.writeHead 301, "Location": "http://placehold.it/1600x200.png/ffffffff&text=#{err.message}"
        res.end()
      readComicsPage comic, page, (err, data) ->
        if err
          res.writeHead 301, "Location": "http://placehold.it/1600x200.png/ffffffff&text=#{err.message}"
          return res.end()
        if data.constructor.name is 'String'
          buffer = new Buffer(data, 'binary')
        else
          buffer = data
        if req.get.format is 'string'
          buffer = escape(buffer.toString('binary'))
        if buffer.length    
          res.write buffer
          res.end()
          if USE_CACHE
            if _.keys(img_cache).length >= MAX_CACHE_SIZE
              console.log "Making room in cache..."
              delete img_cache[_.keys(img_cache)[0]]
            img_cache[JSON.stringify(req.get)] = buffer
            console.log "#{JSON.stringify(req.get)} included in image cache.".toUpperCase()
        else
          #logo = fs.createReadStream "#{__dirfile}#{path.sep}public#{path.sep}img#{path.sep}supermanlogoactual.jpg"
          #logo = fs.createReadStream "./public/img/supermanlogoactual.jpg"
          #logo.pipe res
          res.writeHead 301, "Location": "http://placehold.it/1600x200.png/ffffffff&text=Request resulted in 0 length page"
          res.end()
  catch err
    res.writeHead 301, "Location": "http://placehold.it/1600x200.png/ffffffff&text=#{err.message}"
    res.end()
    
router.get "/item", (req, res) ->
  try
    at = if req.get.at then unescape(req.get.at) else ''
    console.log "Requested path: #{at}"
    getItemAt unescape(at), (err, data) ->
      if err
        res.writeHead 500, "ContentType": "text/plain"
        res.end err.toString()
      else
        res.writeHead 200, "ContentType": "text/x-json"
        res.end JSON.stringify data
  catch err
    res.writeHead 500, "ContentType": "text/plain"
    res.end err.toString()
  
router.get "/statistics", (req, res) ->
  res.writeHead 200, "ContentType": "text/x-json"
  cacheMax = MAX_CACHE_SIZE
  cacheUse = _.keys(img_cache).length
  cacheStats = {cacheUse, cacheMax}  
  res.end JSON.stringify {readRarPages, readZipPages, readCachePages, cacheStats}

#legionthumb: decorative
router.get "/legionthumb", (req, res) ->
  option = Math.ceil(Math.random() * 3)
  res.writeHead 200, "ContentType": "image/jpeg"
  thumb = gm(fs.createReadStream("#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}legion.jpg"), 'legion.jpg')
  if option is 1
    thumb = thumb.sepia()
  if option is 2
    thumb = thumb.type('grayscale')
  thumb.stream().pipe res

router.get "/thumb", (req, res) ->
  #res.writeHead 200, "ContentType": "image/jpeg"
  size =  200
  image = 'supes_logo_blue_bg.jpg'
  thumb = gm(fs.createReadStream("#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}"), 'thumb.png')
  thumb.resize("#{size}%", "#{size}%").antialias().stream().pipe(res)

router.get "/thumb/:image/:proportion", (req, res) ->
  #res.writeHead 200, "ContentType": "image/jpeg"
  size = req.params.proportion or 100
  image = "#{req.params.image}"
  if fs.existsSync "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}.jpg"
    image = "#{image}.jpg"
  else if fs.existsSync "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}.png"
    image = "#{image}.png"
  else if fs.existsSync "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}.gif"
    image = "#{image}.gif"
  else if fs.existsSync "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}.ico"
    image = "#{image}.ico"
  else if fs.existsSync "#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}.bmp"
    image = "#{image}.bmp"
  else
    image = 'supes_logo_blue_bg.jpg'

  console.log "Displaying thumb #{image}"
  thumb = gm(fs.createReadStream("#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}"), image)
  thumb.resize("#{size}%", "#{size}%").antialias().stream().pipe(res)

router.get "/supi_folder", (req, res) ->
  #res.writeHead 200, "ContentType": "image/jpeg"
  size = 10
  #image = 'Superman_Folder.bmp'
  image = 'superman-1920x1080.jpg'
  thumb = gm(fs.createReadStream("#{__dirname}#{path.sep}public#{path.sep}img#{path.sep}#{image}"), 'thumb.ico')
  thumb.resize("#{size}%", "#{size}%").antialias().stream().pipe(res)

router.get "/hello", (req, res) ->
 res.end 'Hello, World!, Hola, Mundo!'

router.get "/users", (req, res) ->
  res.writeHead(200, {'Content-type': 'text/html'})
  res.end '<h1 style="color: navy; text-align: center;">Active members registry</h1>'

router.get "/users/:id", (req, res) ->
  res.writeHead(200, {'Content-type': 'text/html'})
  res.end "<h1>User No: <span style='color: red;'>" + req.params.id + "</span></h1>"

#
#End of routes
#


#Ok, just start the server!

argv = process.argv.slice 2


server.on 'listening', ->
  addr = server.address() or {address: '0.0.0.0', port: argv[0] or 20386}
  router.log "Serving web content at " + addr.address + ":" + addr.port  


clean_up = () ->
  console.log "Shutting Up Silver Age Comics Web Server..."
  ##clearInterval(test_interval)
  server.close()
  fs.unlinkSync("#{__dirname}/server.pid")
  process.exit 0

process.on "SIGINT", clean_up
#process.on "SIGKILL", clean_up
process.on "SIGQUIT", clean_up
#process.on "SIGINT", clean_up


pid = process.pid.toString()
fs.writeFileSync("#{__dirname}/server.pid", pid, 'utf8')
server.listen if argv[0]? and not isNaN(parseInt(argv[0])) then parseInt(argv[0]) else 20386
