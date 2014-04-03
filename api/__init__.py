from flask import current_app
from flaskext.mysql import MySQL


mysql_mod = MySQL()
mysql_mod.init_app(current_app)
mysql = mysql_mod.connect().cursor()
