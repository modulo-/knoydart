from flask import json
from flask.ext import restful
from . import mysql
from flask.ext.restful import reqparse


class Comment(restful.Resource):
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('comment', type=str, help='comment blank', required=True)
        parser.add_argument('author', type=str, help='author blank', required=True)
        parser.add_argument('datapoint_id', type=int, help='datapoint not specified', required=True)
        args = parser.parse_args()

        comment = args["comment"]
        author = args["author"]
        datapoint_id = args["datapoint_id"]

        cursor = mysql.cursor()
        cursor.execute(
            "INSERT "
            "INTO comments "
            "(datapoint_id, author, text) "
            "VALUES "
            "(%s, %s, %s) ",
            (datapoint_id, author, comment))

        mysql.commit()

        return json.dumps({"success":True})