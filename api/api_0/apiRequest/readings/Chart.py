import numbers
import datetime
import time
from flask import json
from flask.ext import restful
from . import mysql
from flask.ext.restful import reqparse


class Chart(restful.Resource):
    @staticmethod
    def fix_row(row, decimal_indices, list_indices):
        # raise Exception(row)
        for i in decimal_indices:
            if isinstance(row[i], numbers.Number):
                row[i] = float(row[i])
            else:
                row[i] = None

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
        parser.add_argument('history_offset', type=int, default=0, help='History offset')
        args = parser.parse_args()

        count = min(args["count"], 500)
        start = args["start"]
        precision = args["granularity"]
        history_offset = args["history_offset"]

        schema = [
            "id",
            "datetime_start",
            "datetime_end",
            "pow_prod",
            "pow_prod_app",
            "pow_prod_avg",
            "pow_prod_act",
            "pow_cons",
            "dam_lvl",
            "rain",
            "flow",
            "comments"
        ]

        schema = {value: index for index, value in enumerate(schema)}

        cursor = mysql.cursor()

        if start == -1:
            end = int(time.mktime(datetime.datetime.utcnow().timetuple()))

            start = end - (count * precision)
        else:
            end = start + (count * precision)

        _start = int(args["start"]/precision)*precision
        delta = start - _start

        query =  ("SELECT "
                "MIN(r.id) AS id, "
                "UNIX_TIMESTAMP(MIN(r.datetime)) AS datetime_start, "
                "UNIX_TIMESTAMP(MAX(r.datetime)) AS datetime_end, "
                "AVG(r.pow_act+r.pow_react) AS pow_prod, "
                "AVG(r.pow_app) AS pow_prod_app, "
                "AVG(r.pow_avg) AS pow_prod_avg, "
                "AVG(r.pow_act) AS pow_prod_act, "
                "SUM(r.elster)*(3600/%s) AS pow_cons, "
                "AVG(r.dam_lvl) AS dam_lvl, "
                "SUM(r.rain/4) AS rain, "
                "AVG(r.dam_flow) AS flow, "
                "GROUP_CONCAT(CONCAT(c.text, 0x1F, c.author, 0x1F, IFNULL(c.facebook_id, '')) ORDER BY c.created DESC SEPARATOR 0x1E) AS comments "
            "FROM readings AS r "
            "LEFT JOIN comments AS c ON r.id = c.datapoint_id "
            "WHERE  "
                "(r.datetime >= FROM_UNIXTIME(%s) AND r.datetime < FROM_UNIXTIME(%s))"
            "GROUP BY FLOOR((UNIX_TIMESTAMP(r.datetime)-%s)/%s)  "
            "ORDER BY r.id DESC "
            "LIMIT %s")

        cursor.execute(
             query,
            (precision, start, end, delta, precision, count))

        rows = [
            self.fix_row(
                list(row),
                [
                    schema["pow_cons"],
                    # schema["pow_cons_hist"],
                    schema["rain"],
                    schema["flow"]
                ],
                [schema["comments"]]
            )
            for row in cursor.fetchall()]

        start -= history_offset
        end -= history_offset

        cursor.execute(
            query,
            (precision, start, end, delta, precision, count))


        rows_hist = [
            self.fix_row(
                list(row),
                [
                    schema["pow_cons"],
                    schema["rain"],
                    schema["flow"]
                ],
                [schema["comments"]]
            )
            for row in cursor.fetchall()]

        for label in dict(schema):
            schema[label + '_hist'] = len(schema)

        i = 0
        for histrow in rows_hist:
            rows[i] += histrow
            i+=1
            if i == len(rows):
                break

        data = {"schema": schema, "data": rows}
        return json.dumps(data)