#!/usr/bin/env python2

import os, sys, signal

os.chdir(os.path.abspath(os.path.dirname(__file__)))

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from silvercomics import ComicsApp

def sig_handler(signal, frame):
  print "Web Server exiting gracefully due to signal: %s" % (signal, )
  try:
    os.unlink('./server.pid')
    os.sys.exit(0)
  except:
    pass


#signals = (signal.SIGINT, signal.SIGHUP, signal.SIGQUIT, signal.SIGTERM, signal.SIGKILL)
#signals = (signal.SIGINT, signal.SIGHUP, signal.SIGQUIT, signal.SIGTERM)
signals = (signal.SIGINT, signal.SIGHUP, signal.SIGQUIT)

for s in signals:
  signal.signal(s, sig_handler)
  
#signal.signal(signal.SIGINT, sig_handler)
#signal.signal(signal.SIGHUP, sig_handler)
#signal.signal(signal.SIGQUIT, sig_handler)
#signal.signal(signal.SIGTERM, sig_handler)
#signal.signal(signal.SIGKILL, sig_handler)

pid = os.getpid()
pidfile = open('./server.pid', 'w')
pidfile.write("%s" % pid)
pidfile.close()

try:
    ComicsApp.run(port = 20086)
except:
    pass


