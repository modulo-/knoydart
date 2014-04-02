from flask import json
from flask.ext import restful
from . import mysql
from flask.ext.restful import reqparse


class Chart(restful.Resource):
    @staticmethod
    def fix_decimals(row, indices):
        for i in indices:
            row[i] = float(row[i])
        return row

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('count', type=int, default=1, help='How many datapoints to return')
        parser.add_argument('start', type=int, default=-1, help='Since which index')
        args = parser.parse_args()

        count = min(args["count"], 100)
        start = args["start"]

        mysql.execute(
            "SELECT "
                "r.id AS id, "
                "UNIX_TIMESTAMP(ADDTIME(r.date, r.time)) AS datetime, "
                "r.pow_avg AS pow_prod, "
                "r.elster*(3600/r.period_len) AS pow_cons, "
                "r.dam_lvl AS dam_lvl "
            "FROM readings AS r "
            "WHERE  "
                "%s < 0 "
                "OR "
                "r.id > %s "
            "ORDER BY r.date ASC, r.time ASC "
            "LIMIT %s",
            (start, start, count))

        rows = [self.fix_decimals(list(row), [3]) for row in mysql.fetchall()]

        schema = ["id", "datetime", "pow_prod", "pow_cons", "dam_lvl"]
        schema = {value: index for index, value in enumerate(schema)}

        data = {"schema": schema, "data": rows}
        return json.dumps(data)