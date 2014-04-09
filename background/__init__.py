__author__ = 'Modulo'

from config import Config as conf
import _mysql

print conf.MYSQL_DATABASE_HOST
print conf.MYSQL_DATABASE_USER
print conf.MYSQL_DATABASE_PASSWORD
print conf.MYSQL_DATABASE_DB

mysql = _mysql.connect(host=conf.MYSQL_DATABASE_HOST, user=conf.MYSQL_DATABASE_USER, passwd=conf.MYSQL_DATABASE_PASSWORD, db=conf.MYSQL_DATABASE_DB)
cursor = mysql.cursor()


cursor.execute("SELECT * FROM comments")
data = cursor.fetchall()
print str(data)

