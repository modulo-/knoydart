from flask.ext import restful


class Readings(restful.Resource):
    def get(self):
        return "all readings"