from flask import Flask

from api import request as apiRequest
from web import web

app = Flask(__name__)
#app.config.from_object('config')

app.register_blueprint(apiRequest, url_prefix='/api')
app.register_blueprint(web)

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def catch_all(path):
    # return 'The path %s is not supported' % path

if __name__ == "__main__":
    app.debug = True
    app.run()
