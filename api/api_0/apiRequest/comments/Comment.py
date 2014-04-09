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
        parser.add_argument('facebook_id', type=int, default=None, help='FB_id not specified')
        args = parser.parse_args()

        comment = args["comment"]
        author = args["author"]
        datapoint_id = args["datapoint_id"]
        facebook_id = args["facebook_id"]

        cursor = mysql.cursor()
        cursor.execute(
            "INSERT "
            "INTO comments "
            "(datapoint_id, author, text, facebook_id) "
            "VALUES "
            "(%s, %s, %s, %s) ",
            (datapoint_id, author, comment, facebook_id))

        mysql.commit()

        return json.dumps({"success":True})