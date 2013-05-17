#!/usr/bin/env coffee

#
#Requires
#

fs = require 'fs'
path = require 'path'
os = require 'os'
http = require 'http'
_when = require 'when'
Router = require 'node-simple-router'
gm = require 'gm'
ZipFile = require 'adm-zip'
RarFile = require('rarfile').RarFile
isRarFile = require('rarfile').isRarFile 

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

readRarPages = 0
readZipPages = 0

#rootDir = "#{__dirname}#{path.sep}"
rootDir = "/home/ernesto/Dropbox/programas/amecro/www/silvercomics#{path.sep}"
contentsDir = "#{rootDir}contents#{path.sep}"

readComicsPage = (comic, page, cb) ->
  fullpath = "#{contentsDir}#{comic.path}"
  console.log "Going to open page ##{page} in #{fullpath}"
  if comic.type is 'rarfile'
    tool = new RarFile fullpath
    func = tool.readFile
  else
    tool = new ZipFile fullpath
    func = tool.readFileAsync
  if comic.type is 'rarfile'
    func comic.pages[page], (err, data) ->
      readRarPages += 1
      cb err, data
  else
    func comic.pages[page], (data) ->
      readZipPages += 1
      cb null, data 

readRarFile = (comic, fullpath, cb) ->
  rf = new RarFile fullpath
  rf.on 'ready', ->
    comic.pages = (f for f in rf.names when path.extname(f).toLowerCase() in ['.jpg', '.jpeg', '.gif', '.png', '.bmp', '.tiff']).sort()
    cb null, comic
  
readZipFile = (comic, fullpath, cb) ->
  zf = new ZipFile fullpath
  comic.pages = (n.name for n in zf.getEntries() when path.extname(n.name).toLowerCase() in ['.jpg', '.jpeg', '.gif', '.png', '.bmp', '.tiff']).sort()
  cb null, comic
  
getItemAt = (at, cb) ->
  fullpath = "#{contentsDir}#{at.trim()}"
  console.log "Requested full path: #{fullpath}"
  return getDirAt at, fullpath, cb unless !!(path.extname(fullpath) in ['.cbr', '.cbz'])
  getComicAt at, fullpath, cb
  
getComicAt = (at, fullpath, cb) ->
  comic = name: path.basename(at.trim()), path: at.trim()
  switch path.extname(at.trim())
    when '.cbr'
      if isRarFile(fullpath) 
        comic.type = 'rarfile'
        return readRarFile comic, fullpath, cb
      else
        comic.type = 'zipfile'
        return readZipFile comic, fullpath, cb
    when '.cbz'
      comic.type = 'zipfile'
      return readZipFile comic, fullpath, cb
    else
      comic.type = 'unknown'
      return cb new Error('Unknown file type'), null
        
getDirAt = (at, fullpath, cb) ->
  directory = name: path.basename(at), path: at, type: 'directory'
  fs.readdir fullpath, (err, data) ->
    return cb err, null if err
    objects = []
    for item in data
      fullitem = name: item, path: "#{at.trim()}#{path.sep}#{item}"
      name = "#{fullpath}#{path.sep}#{item}"
      stat = fs.statSync name
      if stat.isDirectory()
        fullitem.type = "directory"
      else
        switch path.extname(item).toLowerCase()
          when '.cbr'
            if isRarFile(name)
              fullitem.type = 'rarfile'
            else
              fullitem.type = 'zipfile'
          when '.cbz'
            fullitem.type = 'zipfile'
          else
            fullitem.type = 'unknown'
      objects.push fullitem
    directory.files = objects  
    cb null, directory


#
#End of auxiliary functions and definitions
#  

  
#
#Routes
#

router.get "/page", (req, res) ->
  try
    at = unescape(req.get.at).trim()
    page = parseInt req.get.page
    getItemAt at, (err, comic) ->
      throw err unless not err
      readComicsPage comic, page, (err, data) ->
        throw err unless not err
        if data.constructor.name is 'String'
          buffer = new Buffer(data, 'binary')
        else
          buffer = data
        if req.get.format is 'string'
          buffer = escape(buffer.toString('binary'))  
        res.write buffer
        res.end()      
  catch err
    res.writeHead 500, "ContenType": "text/plain"
    res.end err.toString()
    
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
  res.end JSON.stringify {readRarPages, readZipPages}

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
  addr = server.address() or {address: '0.0.0.0', port: argv[0] or 8000}
  router.log "Serving web content at " + addr.address + ":" + addr.port  

process.on "SIGINT", ->
  server.close()
  router.log ' '
  router.log "Server shutting up..."
  router.log ' '
  process.exit 0

server.listen if argv[0]? and not isNaN(parseInt(argv[0])) then parseInt(argv[0]) else 8000
