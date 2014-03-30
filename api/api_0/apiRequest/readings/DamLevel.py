from flask.ext import restful


class DamLevel(restful.Resource):
    def get(self):
        return "The dam is OK"