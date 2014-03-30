from flask import Flask

import config


app = Flask(__name__)
app.config.from_object(config.Config)

with app.app_context():
    from api.api_0 import api as api_0
    from web import web

    app.register_blueprint(api_0, url_prefix='/api/v0')
    app.register_blueprint(web)


@app.route('/list-rules')
def list_rules():
    rules = []
    for rule in app.url_map.iter_rules():
        rules.append((str(rule), str(rule.endpoint)))
    return str(app.config) + "\n" + str(rules)

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def catch_all(path):
#     return 'The path %s is not supported' % path


if __name__ == "__main__":
    app.debug = True
    app.run()
