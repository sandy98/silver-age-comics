#!/usr/bin/env python

from fcgi import WSGIServer
import os, sys    	

sys.path.append(os.path.split(os.path.abspath(__file__))[0])

from silvercomics import ComicsApp

print "Running..."
print

WSGIServer(ComicsApp(), bindAddress = '/tmp/silvercomics.sock').run() 

