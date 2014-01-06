#!/usr/bin/env coffee

path = require 'path'

comics_lister = (directory, cb) ->
  comics = []

  finder = require('findit')(directory)

  finder.on 'file', (file, stat) ->
    if path.extname(file) in ['.cbz', '.cbr']
      comics.push file: file, path: path.resolve(file)

  finder.on 'end', ->
    if cb
      cb comics
    else
      console.log comics
      
  directory


###
comics_lister process.argv[2] or './contents', (comics) ->
  console.log "First comics: #{comics[0]}"
  console.log "Last comics: #{comics[comics.length - 1]}"
  console.log "\n Total files: #{comics.length}"
###

module?.exports = comics_lister


