from flask.ext import restful
from . import mysql

class Readings(restful.Resource):
    def get(self):
        cursor = mysql.cursor()
        cursor.execute("SELECT * FROM readings")
        data = cursor.fetchall()
        return str(data)
