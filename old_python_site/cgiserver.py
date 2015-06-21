#!/usr/bin/env python
#coding=utf-8

import os, sys
from SimpleHTTPServer import SimpleHTTPRequestHandler
import BaseHTTPServer
from comics import ComicsFile
from cStringIO import StringIO

class SimpleHandler(SimpleHTTPRequestHandler):
#    def __init__(self):
#        super(SimpleHandler, self).__init__()
        
    def do_GET(self):
        """Serve a GET request."""
        
        self.send_response(200)

        if self.path != "/img":
            self.send_header("Content-type", "text/html")
            self.end_headers()
            retval = '<h1 style="color: red; text-align: center;">Hola, CGI</h1>'
            mf = StringIO(retval)
            self.copyfile(mf, self.wfile)
        else:
            cf = ComicsFile(os.path.join("contents", "lsh", "comics", "Legion CD 1", 
                "0028-Adventure Comics 312.cbr"))
            ctype, data = cf.getImgTypeAndData(0, 0.5)
            self.send_header("Content-type", ctype)
            self.end_headers()
            mf = StringIO(data)
            self.copyfile(mf, self.wfile)
            
        return 


server = BaseHTTPServer.HTTPServer(('', 10086), SimpleHandler)

try:
    print "Serving at port 10086."
    server.serve_forever()
except KeyboardInterrupt:
    print "Quitting..."
