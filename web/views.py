from . import web
from functools import wraps
from flask import request, Response

def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    return username == 'knoydart' and password == 'power'

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
    'Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated


@web.route("/")
@web.route("/chart-simple")
def index():
    return web.send_static_file('simple.html')

@web.route("/chart-advanced")
def index_adv():
    return web.send_static_file('advanced.html')

@web.route("/chart-tech")
def index_tech():
    return web.send_static_file('tech.html')


@web.route("/api/")
def api_info():
    return web.send_static_file('api.html')


@web.route("/favicon.ico", defaults={'file': 'favicon.ico'})
@web.route("/favicons/<file>")
def get_favicon(file):
    return web.send_static_file('favicons/' + file)


@web.route("/css/<filename>.css")
def get_css(filename):
    return web.send_static_file('css/' + filename + '.css')


@web.route("/js/<filename>.js")
def get_js(filename):
    return web.send_static_file('js/' + filename + '.js')

@web.route("/images/<file>")
def get_image(file):
    return web.send_static_file('images/' + file)

@web.route("/fonts/<file>")
def get_font(file):
    return web.send_static_file('fonts/' + file)

@web.route("/fancybox/<file>")
def get_fancybox(file):
    return web.send_static_file('fancybox/' + file)

