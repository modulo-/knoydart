from . import web


@web.route("/")
def hello():
    return web.send_static_file('index.html')


@web.route("/api/")
def api_info():
    return web.send_static_file('api.html')


@web.route("/favicon.ico", defaults={'file': 'favicon.ico'})
@web.route("/favicons/<file>")
def get_favicon(file):
    return web.send_static_file('favicons/' + file)


@web.route("/css/<filename>.css")
def get_css(filename):
    return web.send_static_file(filename + '.css')


@web.route("/js/<filename>.js")
def get_js(filename):
    return web.send_static_file(filename + '.js')


@web.route("/images/<file>")
def get_image(file):
    return web.send_static_file('images/' + file)
