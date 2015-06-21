#!/usr/bin/env python

import os, sys
from cgi import parse_qs, FieldStorage
import mimetypes
import re

from wsgiref.simple_server import make_server

class BaseWsgiApp(object):
    """
    # Base class for web WSGI Application.
    # Maps its methods to URLs.
    # Able to retrieve static files under the current working directory.
    # Retrieves directories listings.
    """

    version = "0.02"

    routes = ()

    def __init__(self):
        self.params = None
        self.environ = None
        self.start_response = None
        self.requests = 0
        self.directory = os.path.split(os.path.abspath(__file__))[0]

    def __call__(self, environ, start_response):
        self.requests += 1

        self.params = parse_qs(environ['QUERY_STRING'])
        if environ.get('REQUEST_METHOD', 'GET').lower() == 'post':
            fs = FieldStorage(fp=environ['wsgi.input'], environ = environ, keep_blank_values = True)
            for k in fs.keys():
                self.params[k] = [fs.getvalue(k, ''),]
        else:
                sys.stderr.write("Usando GET\n")

        self.path = environ.get('PATH_INFO', '').lstrip('/').rstrip('/')
        if not bool(self.path):
            self.path = "index"
        self.environ = environ
        self.start_response = start_response
        return self._dispatch()

    def _listdir(self, dir):
        self.start_response('200 OK', [('Content-Type', "text/html")])
        dic = {}
        templat = """
        <html>
            <head><title>Directory listing for %(dir)s</title></head>
            <body>
                <div style="border: padding: 0.5em; margin: 1em; solid 1px; font-size: small; left: 150px; right: 150px;">
                    %(content)s
                </div>
            </body>
        </html>
        """
        dic['dir'] = self.path
        content = ""
        for f in os.listdir(dir):
            content += '<a href="/%s/%s">%s</a><br/>' % (dic['dir'], f, f)
        dic['content'] = content
        return [templat % dic]

    def _dispatch(self):
        phpath = os.path.join(self.directory, self.path)
        if os.path.exists(phpath):
            if os.path.isfile(phpath):
                try:
                    ftype = mimetypes.guess_type(phpath)
                    if not ftype[0]:
                        ftype = 'application/octet-stream'
                    else:
                        ftype = ftype[0]
                    self.start_response('200 OK', [('Content-Type', ftype)])
                    f = open(phpath, "rb")
                    data = f.read()
                    f.close()
                    return [data]
                except Exception, msg:
                    sys.stderr.write("%s%s%s" % ("\nError de lectura: ", msg, "\n"))
                    return self.server_error()
            elif os.path.isdir(phpath):
                return self._listdir(phpath)
            else:
                return self.not_found()
        else:
            try:
                callback = None
                kwargs = None

                for route in self.routes:
                    match = re.search(route[0], self.path)
                    if match:
                        kwargs = match.groupdict()
                        if kwargs:
                            args = ()
                        else:
                            args = match.groups()
                        callback = getattr(self, route[1])

                if not callback:
                    spath = self.path.split('/')
                    callback = getattr(self, spath[0])
                    args = tuple(spath[1:])

                if args:
                    return callback(*args)
                elif kwargs:
                    return callback(**kwargs)
                else:
                    return callback()

            except Exception, msg:
                sys.stderr.write("%s%s%s" % ("\nError de objeto: ", msg, "\n"))
                return self.not_found()

        return self.not_found()

    def index(self, *args, **kwargs):
        self.start_response('200 OK', [('Content-Type', 'text/html')])
        header = """
        <html>
            <head>
                <title>Index Page</title>
            </head>
        """
        phargs = ""
        phkwargs = ""
        envvars = ""

        if len(args):
            phargs += "<b>Argumentos Posicionales:</b><br/>"
            for a in args:
                phargs += "%s%s" % (a,'<br/>')
        if len(kwargs):
            phkwargs += "<b>Argumentos Nominales:</b><br/>"
            for k in kwargs:
                phkwargs += "%s: %s%s" % (k, kwargs[k],'<br/>')

	for k in self.environ:
		envvars += "%s: %s%s" % (k, self.environ[k], "<br/>")

	bodydic = {}
	bodydic['scriptname'] = self.environ.get('SCRIPT_NAME','')
	bodydic['path'] = self.path
	bodydic['params'] = self.params
	bodydic['requests'] = self.requests
	bodydic['phargs'] = phargs
	bodydic['phkwargs'] = phkwargs
	bodydic['envvars'] = envvars

        body = """
            <body>
                <h3 style="text-align: center;">Sample Index Page</h3>
                <br/><br/>
                I am: /%(scriptname)s<br/>
                Requested URL is: /%(path)s<br/>
                Parameters passed: %(params)s<br/>
                %(phargs)s
                %(phkwargs)s<hr/>
                Requests received: %(requests)d<hr/>
		</hr>
		%(envvars)s
		</hr>
            </body>
        """ % bodydic

        footer = """</html>"""

        return [header, body, footer]

    def not_found(self):
        """Called if no URL matches."""
        self.start_response('404 NOT FOUND', [('Content-Type', 'text/plain')])
        return ['URL Not Found']

    def server_error(self):
        """Called if something weird happened."""
        self.start_response('500 SERVER ERROR', [('Content-Type', 'text/plain')])
        return ['Internal/unknown server error']

    @classmethod
    def run(cls, host = '0.0.0.0', port = 8086):
        srv = make_server(host, port, cls())
        print "%s serving at port %d ..." % (host, port)
        srv.serve_forever()


if __name__ == '__main__':
	BaseWsgiApp.run()
