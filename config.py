try:
    print "overrride"
    from config_override import Config
except Exception:
    print "original"
    class Config(object):
        DEBUG = True
        TESTING = True

        # MySQL config
        MYSQL_DATABASE_HOST = 'localhost'
        MYSQL_DATABASE_PORT = 3306
        MYSQL_DATABASE_USER = None
        MYSQL_DATABASE_PASSWORD = None
        MYSQL_DATABASE_DB = None
        MYSQL_DATABASE_CHARSET = 'utf8'



        DATATAKER_HOST = '127.0.0.1'
        DATATAKER_PORT = '7700'
        DATATAKER_PASS = 'Asdasd123'

