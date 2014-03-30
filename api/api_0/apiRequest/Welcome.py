from flask.ext import restful

from . import api


class Welcome(restful.Resource):
    def get(self):
        return api.send_static_file('index.html')
