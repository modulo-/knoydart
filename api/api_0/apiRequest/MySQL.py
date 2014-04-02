from flask.ext import restful

from . import mysql


class MySQL(restful.Resource):
    def get(self):

        mysql.execute("SHOW TABLES")
        data = mysql.fetchall()
        return str(data)
