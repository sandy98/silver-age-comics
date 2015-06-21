#!/usr/bin/env python

#apacheAdapter.py
#to deploy under apache mod_wsgi
# -*- coding: utf-8 -*-

import os, sys
#from cgi import parse_qs, FieldStorage
#import mimetypes
#import re
#from wsgiref.simple_server import make_server

sys.path.append(os.path.split(os.path.abspath(__file__))[0])
os.chdir(os.path.split(os.path.abspath(__file__))[0])

from silvercomics import ComicsApp

application = ComicsApp()

