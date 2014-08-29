from flask import json, make_response
from flask.ext import restful
from flask.ext.restful import reqparse
import requests
import datetime, time



class Pages(restful.Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('page', type=str, default='boat', help='Which page is asking for data')
        args = parser.parse_args()
        page= args["page"]

        val = self._get(page)
        resp = make_response(str(val), 200)

        h = resp.headers

        h['Access-Control-Allow-Origin'] = '*'
        h['Access-Control-Allow-Methods'] = 'GET'
        h['Access-Control-Max-Age'] = str(21600)
        return resp

    def _get(self, page):
        url = 'http://knoydart.modulo.ee/api/v0/readings/chart2?start={}&period={}&granularity={}'
       
        url2 = 'http://knoydart.modulo.ee/api/v0/readings/pages?page={}' 

        now = datetime.datetime.utcnow()

        if page == "lastMonth":
            end = now - datetime.timedelta(hours=now.hour, minutes=now.minute, seconds=now.second, days=now.day-1)
            start = end - datetime.timedelta(days=1)
            start -= datetime.timedelta(hours=start.hour, minutes=start.minute, seconds=start.second, days=start.day-1)

            timestamp_start = int(time.mktime(start.timetuple()))
            timestamp_end = int(time.mktime(end.timetuple()))
            period = timestamp_end-timestamp_start

            data = json.loads(requests.get(url.format(timestamp_start, period, 60*10)).text)

            headers = [x[0] for x in sorted(data['schema'].iteritems(), key=lambda (k,v): (v,k))]
            rows = data['data']
            matrix = [headers]+rows
            return '\n'.join([','.join([str(v) for v in row[1:]]) for row in matrix])

        elif page == "latest":
            then = now - datetime.timedelta(minutes=1)
            timestamp = int(time.mktime(then.timetuple()))

            data = json.loads(requests.get(url.format(timestamp, 60, 60)).text)
            x = data['data'][0][data['schema']['pow_prod_app']]

            return x

        elif page == "hourMoney":
            then = now - datetime.timedelta(hours=1)
            timestamp = int(time.mktime(then.timetuple()))

            data = json.loads(requests.get(url.format(timestamp, 60*60, 60*60)).text)
            x = data['data'][0][data['schema']['pow_prod_app']]

            price = 0.08 if then.hour>=11 or then.hour<=7 else  0.14
            return x*price

        elif page == "yesterdayMoney":
            midnight = now - datetime.timedelta(hours=now.hour, minutes=now.minute, seconds=now.second, days=1)
            morning = midnight + datetime.timedelta(hours=7)
            evening = morning + datetime.timedelta(hours=16)

            then = now - datetime.timedelta(hours=1)

            timestamp = int(time.mktime(midnight.timetuple()))
            data = json.loads(requests.get(url.format(timestamp, 60*60*7, 60*60*7)).text)
            x1 = data['data'][0][data['schema']['pow_prod_app']]*7

            timestamp = int(time.mktime(morning.timetuple()))
            data = json.loads(requests.get(url.format(timestamp, 60*60*16, 60*60*16)).text)
            x2 = data['data'][0][data['schema']['pow_prod_app']]*16

            timestamp = int(time.mktime(evening.timetuple()))
            data = json.loads(requests.get(url.format(timestamp, 60*60*1, 60*60*1)).text)
            x3 = data['data'][0][data['schema']['pow_prod_app']]*1

            return (x1+x3)*0.08+x2*0.14

        elif page == "yesterdayUsage":
            then = now - datetime.timedelta(hours=now.hour, minutes=now.minute, seconds=now.second, days=1)
            timestamp = int(time.mktime(then.timetuple()))        

            data = json.loads(requests.get(url.format(timestamp, 60*60*24, 60*60*24)).text)
            x = data['data'][0][data['schema']['pow_prod_app']]*24

            return x


        elif page == "yesterdayUnused":
            then = now - datetime.timedelta(hours=now.hour, minutes=now.minute, seconds=now.second, days=1)
            timestamp = int(time.mktime(then.timetuple()))

            data = json.loads(requests.get(url.format(timestamp, 60*60*24, 60*60*24)).text)
            x = data['data'][0][data['schema']['pow_prod_app']]*24

            return 180*24-x
        elif page == "yesterdayPercent":
            then = now - datetime.timedelta(hours=now.hour, minutes=now.minute, seconds=now.second, days=1)
            timestamp = int(time.mktime(then.timetuple()))
            
            data = json.loads(requests.get(url.format(timestamp, 60*60*24, 60*60*24)).text)
            x = data['data'][0][data['schema']['pow_prod_app']]/180
 
            return x*100
        else:
            return "The past hour did exist"
