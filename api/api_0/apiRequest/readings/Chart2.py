import numbers
import datetime
from flask import json
from flask.ext import restful
from . import mysql
from flask.ext.restful import reqparse


class Chart2(restful.Resource):
    @staticmethod
    def fix_row(row, decimal_indices, list_indices):
        # raise Exception(row)
        for i in decimal_indices:
            if isinstance(row[i], numbers.Number):
                row[i] = float(row[i])
            else:
                row[i] = None
        return row

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('start', type=int, default=0, help='Since which timestamp')
        parser.add_argument('period', type=int, default=0, help='how many seconds')
        parser.add_argument('granularity', type=int, default=1, help='Data precision - this many seconds in one record')
        args = parser.parse_args()

        granularity = args["granularity"]
        start = args["start"]
        _start = int(args["start"]/granularity)*granularity
        period = int(args["period"]/granularity)*granularity
        delta = start - _start


        schema = [
            "datetime_start",
            "timestamp_start",
            "timestamp_end",
            "pow_prod",
            "pow_prod_app",
            "pow_prod_avg",
            "pow_prod_act",
            "dam_lvl"
        ]

        schema = {value: index for index, value in enumerate(schema)}

        cursor = mysql.cursor()

        end = start + period


        cursor.execute(
            "SELECT "
                "FROM_UNIXTIME(MIN(UNIX_TIMESTAMP(r.datetime))) AS datetime_start, "
                "UNIX_TIMESTAMP(MIN(r.datetime)) AS timestamp_start, "
                "UNIX_TIMESTAMP(MAX(r.datetime)) AS timestamp_end, "
                "AVG(r.pow_act+r.pow_react) AS pow_prod, "
                "AVG(r.pow_app) AS pow_prod_app, "
                "AVG(r.pow_avg) AS pow_prod_avg, "
                "AVG(r.pow_act) AS pow_prod_act, "
                "AVG(r.dam_lvl) AS dam_lvl "
            "FROM readings AS r "
            "WHERE  "
                "(r.datetime >= %s AND r.datetime < %s)"
            "GROUP BY FLOOR((UNIX_TIMESTAMP(r.datetime)-%s)/%s)  "
            "ORDER BY r.datetime DESC ",
            (str(datetime.datetime.fromtimestamp(start)), str(datetime.datetime.fromtimestamp(end)), delta, granularity))

        rows = [
            self.fix_row(
                list(row),
                [
                ],
                [
]
            )
            for row in cursor.fetchall()]

        data = {"schema": schema, "data": rows}
        return json.loads(json.dumps(data))
