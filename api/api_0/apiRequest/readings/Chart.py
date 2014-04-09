from flask import json
from flask.ext import restful
from . import mysql
from flask.ext.restful import reqparse


class Chart(restful.Resource):
    @staticmethod
    def fix_row(row, decimal_indices, list_indices):
        for i in decimal_indices:
            row[i] = float(row[i])

        for i in list_indices:
            if row[i] is None:
                row[i] = []
            else:
                row[i] = row[i].split(chr(0x1E))
                comments = []
                for j in row[i]:
                    k = j.split(chr(0x1F))
                    comment = {"author":k[1], "text":k[0], "fb_id":k[2]}
                    comments.append(comment)
                row[i] = comments

        return row

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('count', type=int, default=1, help='How many datapoints to return')
        parser.add_argument('start', type=int, default=-1, help='Since which index')
        parser.add_argument('granularity', type=int, default=1, help='Data precision')
        args = parser.parse_args()

        count = min(args["count"], 100)
        start = args["start"]
        precision = args["granularity"]

        cursor = mysql.cursor()
        cursor.execute(
            "SELECT "
                "MIN(r.id) AS id, "
                "MIN(UNIX_TIMESTAMP(ADDTIME(r.date, r.time))) AS datetime_start, "
                "MAX(UNIX_TIMESTAMP(ADDTIME(r.date, r.time))) AS datetime_end, "
                "AVG(r.pow_act+r.pow_react) AS pow_prod, "
                "AVG(r.elster*(3600/r.period_len)) AS pow_cons, "
                "AVG(r.dam_lvl) AS dam_lvl, "
                "GROUP_CONCAT(CONCAT(c.text, 0x1F, c.author, 0x1F, IFNULL(c.facebook_id, '')) ORDER BY c.created DESC SEPARATOR 0x1E) AS comments "
            "FROM readings AS r "
            "LEFT JOIN comments AS c ON r.id = c.datapoint_id "
            "WHERE  "
                "%s < 0 "
                "OR "
                "r.id > %s "
            "GROUP BY ROUND(r.id/%s) "
            "ORDER BY r.date ASC, r.time ASC "
            "LIMIT %s",
            (start, start, precision, count))

        schema = ["id", "datetime_start", "datetime_end", "pow_prod", "pow_cons", "dam_lvl", "comments"]
        schema = {value: index for index, value in enumerate(schema)}

        rows = [self.fix_row(list(row), [schema["pow_cons"]], [schema["comments"]])
                for row in cursor.fetchall()]


        data = {"schema": schema, "data": rows}
        return json.dumps(data)