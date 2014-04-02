from flask.ext import restful
from . import mysql

class Readings(restful.Resource):
    def get(self):

        mysql.execute("SELECT * FROM readings")
        data = mysql.fetchall()
        return str(data)
