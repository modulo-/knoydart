from . import api, request
from flask.ext import restful

class HelloWorld(restful.Resource):
    def get(self):
        return request.send_static_file('index.html')
        # return "Welcome to the API"
    def post(self):
        return request.send_static_file('index.html')
        # return "Welcome to the API"

api.add_resource(HelloWorld, '/')
