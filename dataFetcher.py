#!/usr/bin/python           # This is client.py file

import socket
import sys
from config import Config as conf
import time
import _mysql

def parseData(rawData):
    print len(rawData)
    parsedData = []
    for line in rawData.split('\r\n'):
        parsedData.append(line.split(','))
    return parsedData


def insertData(parsedData):
    h = ['"Timestamp"', '"TZ"', '"Active power: (kW)"', '"Reactive power: (kvar)"', '"Apparent power: (kVA)"', '"Average power: (kW)"', '"Max Demand: (kWh)"', '"elster_kwhrs (Counts)"', '"rain_0.25mm/count (Counts)"', '"flow m3 (Counts)"', '"dam level (mm)"']
    headers = parsedData[0]
    if h != headers:
        print "DataTaker Headers have changed"
        print h
        print headers
        exit()

    q = "INSERT IGNORE INTO readings (date, time, pow_act, pow_react, pow_app, pow_avg, demand_max, elster, rain, dam_flow, dam_lvl) VALUES "

    values = []
    for row in parsedData[1:]:
        if 'DT80>' in row:
            continue

        dataRow = row[0].split() + row[2:]
        values.append('"' + '","'.join(dataRow) + '"')
    q += '(' + '),('.join(values) + ')'

    # print q
    passwd = '' if conf.MYSQL_DATABASE_PASSWORD is None else conf.MYSQL_DATABASE_PASSWORD

    mysql = _mysql.connect(host=conf.MYSQL_DATABASE_HOST, user=conf.MYSQL_DATABASE_USER, passwd=passwd, db=conf.MYSQL_DATABASE_DB)
    # cursor = mysql.cursor()
    mysql.query(q)
    mysql.commit()


def main():
    print time.ctime()
    host = conf.DATATAKER_HOST
    port = conf.DATATAKER_PORT
    user = None
    password = conf.DATATAKER_PASS
    buff = 4096

    complete = '\r\nUnload complete.\r\n'
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = s.connect_ex((host, port))
    s.setblocking(0)

    if result > 0:
        print "problem with socket!"
    else:
        print "everything it's ok!"

    # s.sendall('COPYD \r')
    s.sendall('COPYD start=-01:00:00.00 \r')
    time.sleep(0.5)

    i = 1
    rawData = ''

    while i > 0:
        time.sleep(0.5)
        try:
            rawData += s.recv(buff)
            sys.stdout.write('#')
            # print 'Received by iteration ', i, " (len)", len(rawData), ":", repr(rawData)
            i += 1

        except Exception:
            if complete in rawData:
                rawData = rawData[0:-len(complete)]
                i = -i
                continue

            print "Received nothing..."
            print rawData
            if i < 3:
                print "i=", i, "trying again...deleting old received data"
                rawData = ''
                continue
            else:
                print "i=", i, "giving up..."
                break
    else:
        print 'OK'
        insertData(parseData(rawData))

    s.shutdown(socket.SHUT_RDWR)
    s.close()

if __name__ == "__main__":
    main()