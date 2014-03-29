from . import web
 
@web.route('/')
def status():
    return web.send_static_file('index.html')

@web.route('/asd')
def asd():
    return "asd"
