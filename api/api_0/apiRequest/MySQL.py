from flask.ext import restful

from . import mysql


class MySQL(restful.Resource):
    def get(self):
        cursor = mysql.cursor()
        cursor.execute("SHOW TABLES")
        data = cursor.fetchall()
        return str(data)
