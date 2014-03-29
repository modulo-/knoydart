from flask import Blueprint
from flask.ext import restful

request = Blueprint('request', __name__, static_folder='static', template_folder='templates')

api = restful.Api()
api.init_app(request)


import requests
