from . import _api

from apiRequest.Welcome import Welcome
from apiRequest.MySQL import MySQL
from apiRequest.readings.Readings import Readings
from apiRequest.readings.DamLevel import DamLevel
from apiRequest.readings.Chart import Chart
from apiRequest.comments.Comment import Comment

_api.add_resource(Welcome, '/')
_api.add_resource(MySQL, '/mysql')
_api.add_resource(Readings, '/readings/')
_api.add_resource(DamLevel, '/readings/damlevel/')
_api.add_resource(Chart, '/readings/chart/')
_api.add_resource(Comment, '/comments/')
