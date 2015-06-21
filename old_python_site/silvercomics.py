#!/usr/bin/env python
#silvercomics.py
#to deploy under apache 

import os, sys, math
import Cookie 
from sqlite3 import dbapi2 as sqlite

try:
    import json as json
except:
    import simplejson as json

sys.path.append(os.path.split(os.path.abspath(__file__))[0])

from wsgiapp import BaseWsgiApp
from comics import ComicsFile

class ComicsApp(BaseWsgiApp):
    def __init__(self):
        super(ComicsApp, self).__init__()
        self.visitsFile = os.path.join(self.directory, "visits.txt")
        if not os.path.exists(self.visitsFile):
            vf = open(self.visitFile, "w")
            vf.write("0")
            vf.close()
        self.comicsRoot = os.path.join(self.directory, "contents")
    
    def __increaseVisits(self):
        vf = open(self.visitsFile, 'r')
        visits = int(vf.read())
        vf.close()
        visits += 1
        vf = open(self.visitsFile, "w")
        vf.write(str(visits))
        vf.close()
        
    def getVisits(self):
        try:
            self.start_response('200 OK', [('Content-Type', 'text/plain')])
            return [open(self.visitsFile).read()]
        except:
            pass
    
    def index(self):
        try:
            self.start_response('200 OK', [('Content-Type', 'text/html')])
            indexfile = os.path.join(self.directory, 'index.html')
            retval = [open(indexfile).read()]
            self.__increaseVisits()
            return retval
        except:
            pass
        
    def envinfo(self):
        try:
            return BaseWsgiApp.index(self)
        except:
            pass
        
    def getTotalPages(self, *args):
        comicsFile = None
        if len(args) > 0:
            comicsFile = "/".join(args)
        if "comicsFile" in self.params:
            comicsFile = self.params["comicsFile"][0]
        cf = ComicsFile(os.path.join(self.comicsRoot, comicsFile))
        try:
            self.start_response('200 OK', [('Content-Type', 'text/plain')])
            return [str(cf.getNumPages())]
        except:
            pass
        
    def showTheThumb(self, *args):
        try:
            comicsFile = ""
            index = 0
            proportion = 0.2
        
            if len(args) > 0:
                index = int(args[0])
            if len(args) > 1:
                proportion = float(args[1])
            if "comicsFile" in self.params:
                comicsFile = self.params["comicsFile"][0]
            if "index" in self.params:
                index = int(self.params["index"][0])
            if "proportion" in self.params:
                sys.stderr.writelines([str(self.params["proportion"])])
                proportion = float(self.params["proportion"][0])

            cf = ComicsFile(os.path.join(self.comicsRoot, comicsFile))
            return cf.wsgiThumb(self.start_response, index, proportion)
        except:
            pass
        
    def getContents(self):
        try:
            self.start_response('200 OK', [('Content-Type', 'text/plain')])

            tmpli = os.path.split(self.comicsRoot)
        
            if not 'folder' in self.params:
                folder = self.comicsRoot
#               shownFolder = tmpli[len(tmpli) - 1]
                shownFolder = ""
            else:
                folder = os.path.join(self.comicsRoot, self.params['folder'][0])
#               shownFolder = os.path.join(tmpli[len(tmpli) - 1], self.params['folder'][0])
                shownFolder = self.params['folder'][0]
            if not 'page' in self.params:
                page = 1
            else:
                page = int(self.params['page'][0])
                if page < 1:
                    page = 1
            if not 'pageLen' in self.params:
                pageLen = 5
            else:
                pageLen = int(self.params['pageLen'][0])


            res = os.walk(folder).next()
            contents = []

            if res[1]:
                res[1].sort()
                for f in res[1]:
                    contents.append({'itemName': f, 'itemType': 'folder'})
            if res[2]:
                res[2].sort()
                for f in res[2]:
                    if ComicsFile.isComicsFile(os.path.join(res[0], f)):
                        contents.append({'itemName': f, 'itemType': 'comics'})   
        
            retval = {'folder': shownFolder}
            retval['pageLen'] = pageLen
            retval['totalPages'] = int(math.ceil((len(contents) * 1.0)/ pageLen))
            if page > retval['totalPages']:
                page = retval['totalPages']
            retval['page'] = page
            start = (page - 1) * pageLen
            end = start + pageLen
            contents = contents[start:end]
            retval['contents'] = contents
            return [json.dumps(retval)]
        except:
            pass
        
    def __getCookie(self):
#        cookiesList = self.environ['HTTP_COOKIE'].split(";")
#        cookies = {}
#        yield self.environ['HTTP_COOKIE']
#        for c in cookiesList:
#            cookies[c.split("=")[0].strip()] = c.split("=")[1].strip() 
#        yield "\n\nCookie: \n"
#        for k in cookies.keys():
#            yield "%s = %s\n" % (k, cookies[k])
        c = Cookie.SimpleCookie(self.environ['HTTP_COOKIE'])
        if not 'hits' in c:
            c['hits'] = "1"
        else:
            c['hits'] = str(int(c['hits'].value) + 1)
        try:
            self.start_response('200 OK', [('Content-Type', 'text/html'), 
            ('Set-Cookie', "hits=%s" % c['hits'].value)])
            yield "User: %s<br/>" % c['usr'].value
            yield "Hits: %s<br/>" % c['hits'].value
            yield '<script type="text/javascript" src="js/jquery-1.3.2.min.js"></script>'
            yield '<script type="text/javascript" src="js/jquery.cookie.js"></script>'
            yield '<script type="text/javascript">alert("Hits: " + $.cookie("hits"))</script>'
        except:
            pass
        
    def _chkMember(self, usr, pwd):
        db = sqlite.connect(os.path.join(os.path.split(os.path.abspath(__file__))[0], "silvercomics.sqlite"))
        cursor = db.cursor()
        cursor.execute("select count(*) from members where email = ?" , (usr,))
        cantidad = int(cursor.fetchone()[0])
        if not cantidad:
            return (0, 'Wrong member')
        cursor.execute("select id, email, nick, pwd, member_from from members where email = ?", (usr,))
        rs = cursor.fetchone()
        if rs[3] != pwd:
            return (0, 'Wrong password')
        return (1, rs)

    def doLogin(self):
        responseList = [('Content-Type', 'text/plain')]
        retval = []
        
        if not 'usr' in self.params or not 'pwd' in self.params:
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': -1, 'reason': 'Missing USR and/or PWD'}))
            return retval
        
        usr = self.params['usr'][0]
        pwd = self.params['pwd'][0]
        
        chkmember = self._chkMember(usr, pwd)
        if not chkmember[0]:
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': -1, 'reason': chkmember[1]}))
            return retval
        
        responseList.append(('Set-Cookie', "usr=%s" % str(chkmember[1][1])))
        responseList.append(('Set-Cookie', "pwd=%s" % str(chkmember[1][3])))
        responseList.append(('Set-Cookie', "nick=%s" % str(chkmember[1][2])))
        
        try:
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': 0, 'reason': 'OK'}))
            return retval
        except:
            pass

    def doRegister(self):
        responseList = [('Content-Type', 'text/plain')]
        retval = []
        
        if not 'usr' in self.params or not 'pwd' in self.params or not 'nick' in self.params:
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': -1, 'reason': 'Missing data'}))
            return retval
        
        usr = self.params['usr'][0]
        pwd = self.params['pwd'][0]
        nick = self.params['nick'][0]
        
        db = sqlite.connect(os.path.join(os.path.split(os.path.abspath(__file__))[0], "silvercomics.sqlite"))
        cursor = db.cursor()
        cursor.execute("select count(*) from members where email = ?" , (usr,))
        cantidad = int(cursor.fetchone()[0])

        if cantidad:
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': -1, 'reason': 'eMail already exists in database'}))
            return retval
        
        cursor.execute("insert into members (email, nick, pwd) values(?, ?, ?)" , (usr, nick, pwd))
        db.commit()
        
        responseList.append(('Set-Cookie', "usr=%s" % usr))
        responseList.append(('Set-Cookie', "pwd=%s" % pwd))
        responseList.append(('Set-Cookie', "nick=%s" % nick))
        try:        
            self.start_response('200 OK', responseList)
            retval.append(json.dumps({'status': 0, 'reason': 'OK'}))
            return retval
        except:
            pass
    
        
if __name__ == '__main__':
    try:
        if len(sys.argv) < 2:
            ComicsApp.run()
        else:
            ComicsApp.run(port=int(sys.argv[1]))
    except KeyboardInterrupt:
        print "\nBye Bye"
