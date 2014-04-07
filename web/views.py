from . import web


@web.route("/")
def hello():
    return web.send_static_file('index.html')

@web.route("/1")
def index1():
    return web.send_static_file('index_canvasjs.html')

@web.route("/2")
def index2():
    return web.send_static_file('index_highchart.html')


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

@web.route("/fancybox/<file>")
def get_fancybox(file):
    return web.send_static_file('fancybox/' + file)
