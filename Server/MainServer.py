from http import client
from http.server import HTTPServer
from operator import index
from typing import Any
import tornado.web
import tornado.websocket
import tornado.ioloop
from pathlib import Path

project_path = Path(r'C:\Users\szymo\PycharmProjects\WebSocketGame\POL12V')
index_html = str(project_path) + "\HtmlTemplates\index.html"


class htmlRequesthandler(tornado.web.RequestHandler):
    """Render Game page
    """
    def get(self):
        self.render(index_html)

class gamewebSocketHandler(tornado.websocket.WebSocketHandler):
    def __init__(
        self, application: tornado.web.Application,
        request: tornado.httputil.HTTPServerRequest,
        **kwargs: Any
         ) -> None:

        self.client_ip = getattr(request, 'remote_ip')
        super().__init__(application, request, **kwargs)

    def open(self):
        print("open socket of ip: ", self.client_ip)

    def on_close(self):
        print("close")

    def on_message(self, message):
        print("message")
        self.write_message(message + " OK")

    def check_origin(self, origin):
        print("ORIGIN: ",origin)
        return True


if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/test", htmlRequesthandler),
        (r"/ws", gamewebSocketHandler),
    ])

    app.listen(8888)
    tornado.ioloop.IOLoop.instance().start()