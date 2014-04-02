from flask import Blueprint
from flask.ext import restful
from .. import mysql


api = Blueprint('request', __name__, static_folder='static', template_folder='templates')

_api = restful.Api()
_api.init_app(api)

import apiRequests