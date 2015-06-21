#!/usr/bin/env python2
# -*- coding=utf-8 -*-

import os, sys

import zipfile
import rarfile
from PIL import Image
from mimetypes import guess_type 

try:
    from cStringIO import StringIO
except:
    from StringIO import StringIO
    
class ComicsFile(object):
    """
    Represents Comics File, be it a rar (*.cbr) or a zip (*.cbz) one.
    Provides methods to access individual pages
    """
    
    version = "1.0"

    def __init__(self, filename):
        if not os.path.exists(filename):
            raise IOError("File %s does not exist." % filename)
        self.filename = filename

        self.filetype = None
        if rarfile.is_rarfile(self.filename):
            self.filetype = "rar"
        elif zipfile.is_zipfile(self.filename):
            self.filetype = "zip"
        else:
            raise TypeError("File type not supported.")
        
        if self.filetype == 'zip':
            self.constructor = zipfile.ZipFile
        else:
            self.constructor = rarfile.RarFile
        
        self.compressedFile = self.constructor(self.filename)
        self.pagesList = [x for x in self.compressedFile.namelist() \
            if guess_type(x)[0] is not None and guess_type(x)[0].startswith('image')]
        self.pagesList.sort()
        
    def getNumPages(self):
        return len(self.pagesList)

    def __getitem__(self, index):
        if index in self.pagesList:
            return Image.open(StringIO(self.compressedFile.read(index)))
        if index < 0 or index >= self.getNumPages():
            raise IndexError("Image out of range")
        return Image.open(StringIO(self.compressedFile.read(self.pagesList[index])))
    
    def thumb(self, index, proportion):
        orig_img = self[index]
        return orig_img.resize((int(orig_img.size[0] * proportion), 
            int(orig_img.size[1] * proportion)), Image.ANTIALIAS)
    
    def getImgTypeAndData(self, index, proportion = 1.0):
        thumb_img = self.thumb(index, proportion)   
        imgType = ""
        if index in self.pagesList:
            imgType = guess_type(index)[0]
        else:
            imgType = guess_type(self.pagesList[index])[0]
        mf = StringIO()
        subtype = imgType.split("/")[1]
        thumb_img.save(mf, subtype)
        mf.seek(0)
        
        return imgType, mf.read()
            
    def cgiThumb(self, index, proportion = 1.0):
        imgType, imgData = self.getImgTypeAndData(index, proportion)
        retData = "Content-type: %s\n\n" % imgType
        retData += imgData
        print retData

    def wsgiThumb(self, start_response, index, proportion = 1.0):
        imgType, imgData = self.getImgTypeAndData(index, proportion)
        start_response('200 OK', [('Content-Type', imgType)])
        retval = [imgData]
        return retval

    @staticmethod
    def isComicsFile(filename):
        return os.path.isfile(filename) and \
    (zipfile.is_zipfile(filename) or rarfile.is_rarfile(filename))


def test():
    print "ComicsFile version %s" % ComicsFile.version
    if len(sys.argv) < 2:
        print "Usage: python comics.py comicsfile"
        sys.exit(-1)
    if not ComicsFile.isComicsFile(sys.argv[1]):
        print "Sorry, %s is not a comics file." % sys.argv[1]
        sys.exit(-2)
        
    cf = ComicsFile(sys.argv[1])
    print "File name: %s\nFile type: %s\nNum pages: %s\n" % (cf.filename, cf.filetype, cf.getNumPages())
    print
    for i, p in enumerate(cf.pagesList):
        print i, p 
    print
    opt = ''
    while not opt.lower().startswith('q'):
        opt = raw_input("Choose an image number to view(0-%s): " % (cf.getNumPages() - 1,))
        if opt in [str(x) for x in range(cf.getNumPages())]:
#            cf[int(opt)].show()
#            cf.thumb(int(opt), 0.2).show()
            imgtype, data = cf.getImgTypeAndData(int(opt), proportion = 0.5)
            mf = StringIO(data)
            print "Image type: %s" % imgtype
            Image.open(mf).show()
            
if __name__ == '__main__':
    test()
    
