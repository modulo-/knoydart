from flask import Blueprint, current_app
from flask.ext import restful

from flaskext.mysql import MySQL


api = Blueprint('request', __name__, static_folder='static', template_folder='templates')

_api = restful.Api()
_api.init_app(api)

mysql = MySQL()
mysql.init_app(current_app)

import apiRequests