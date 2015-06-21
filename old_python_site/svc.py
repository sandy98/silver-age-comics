# -*- coding: utf-8 -*-

import sys
from SimpleXMLRPCServer import SimpleXMLRPCServer

import win32serviceutil
import win32service
import win32event

import threading
from silvercomics import ComicsApp
from flup.server.fcgi import WSGIServer

def runserver():
    while True:
        try:
            ComicsApp.run(port=9000)
#            WSGIServer(ComicsApp()).run()                
        except:
            pass

class SilverComicsWebService(win32serviceutil.ServiceFramework):
    _svc_name_ = "SilverComicsService"
    _svc_display_name_ = "Silver Age Comics Web Service"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        # Create an event which we will use to wait on.
        # The "service stop" request will set this event.
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        # Before we do anything, tell the SCM we are starting the stop process.
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        # And set my event.
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        # We do nothing other than wait to be stopped!
        server = threading.Thread(target = runserver, name="silvercomicsservice")
        server.daemon = True
        server.start()
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

if __name__=='__main__':
    win32serviceutil.HandleCommandLine(SilverComicsWebService)
