from ast import match_case
from asyncio.windows_events import NULL
from email import message
from http import client
from http.server import HTTPServer
from multiprocessing.dummy import Array
from typing import Any
from warnings import catch_warnings
import tornado.web
import tornado.websocket
import tornado.ioloop
import os
import threading
from config import settings

games = []

clients = {}

max_clients = [x for x in range(256)]


class Game(threading.Thread):
    def __init__(self) -> None:
        super().__init__()
        self.client_1 = None
        self.client_2 = None
        self.disconnected = None
        self.game_state = None
        self.game_id = None
        self.player1_move = 1
        self.player2_move = 0
        self.player1_goal = 0
        self.player2_goal = 0

    def checkClient(self, client_id):
        return client_id in {self.client_1, self.client_2}

    def checkSeat(self, game_id):
        return game_id == self.game_id

    def checkGameState(self):
        return len(self.game_state)

    def createGameState(self):
        self.game_state = []

    def updateGameState(self, data):
        if len(data) > len(self.game_state):
            if len(self.game_state) == 0:
              for i in range(0, len(data)):
                self.game_state.append(data[i])
            else:
              for i in range(len(self.game_state), len(data)):
                self.game_state.append(data[i])
        print(self.game_state, data[0])
                

    def clear_client(self, client_id):
        if client_id == self.client_1:
            self.disconnected = self.client_1
            self.client_1 = None
            return
        self.disconnected = self.client_2
        self.client_2 = None

    def __call__(self):
        self.start()

    def run(self):
        pass


game_queue: Game = None


class htmlRequesthandler(tornado.web.RequestHandler):
    """Render Game page
    """
    def get(self):
        self.render(settings["template_path"] + "\index.html")

class gamewebSocketHandler(tornado.websocket.WebSocketHandler):
    def __init__(self, application, request, **kwargs):
        super(gamewebSocketHandler, self).__init__(application, request, **kwargs)
        self.client_id = int(max_clients.pop())
        self.client_ip = getattr(request, 'remote_ip')

    def open(self):
        print(f'Client with client id: {self.client_id} connected')
        clients[self.client_id] = self

    def on_message(self, message):
        print(message)
        mv = memoryview(message)
        mv_data = memoryview(mv[2:])
        # for i in range(0,len(message)):
        #     print(mv[i])
        global game_queue
        if mv[0] == 0:
            print(f'Action is to create a game requested by {self.client_id}')
            game_id = len(games)
            msg = bytearray(b'\x00')
            msg += bytes([game_id])

            game_queue = Game()
            game_queue.client_1 = self.client_id
            game_queue.game_id = game_id
            game_queue.createGameState()
            clients[self.client_id].write_message(bytes(msg), binary=True)
            games.append(game_queue)
            game_queue = None
            

        if mv[0] == 1:
            print(f'Action is to join a game requested by {self.client_id}')
            game_id = mv[1]

            games_temp = list(filter(lambda x: x.checkSeat(game_id), games))
            games_temp2 = list(filter(lambda x: x.checkClient(self.client_id), games))
            print(games_temp, games_temp2)
            if(games_temp and not games_temp2):
                game = list(filter(lambda x: x.checkSeat(game_id), games)).pop()
                print(len(games))
                msg = bytearray(b'\x01')
                msg += bytes([game_id])
                print(game)

                if game.client_1 == None:
                    game.client_1 = self.client_id
                    msg += bytes([0])
                    clients[self.client_id].write_message(bytes(msg), binary=True)
                    print(f'{self.client_id} 1 is joing the game {game_id}')
                    print("GAME STATUS CLIENTS: ", game.client_1, game.client_2)
                    msg_update= bytearray(b'\x03')
                    msg_update += bytes([game.player1_move])
                    msg_update += bytearray(game.game_state)
                    clients[self.client_id].write_message(bytes(msg_update), binary=True)
                elif game.client_2 == None:
                    game.client_2 = self.client_id
                    msg += bytes([0])
                    clients[self.client_id].write_message(bytes(msg), binary=True)
                    print(f'{self.client_id} 2 is joing the game {game_id}')
                    print("GAME STATUS CLIENTS: ", game.client_1, game.client_2)
                    msg_update = bytearray(b'\x03')
                    msg_update += bytes([game.player2_move])
                    msg_update += bytearray(game.game_state)
                    print(msg_update)
                    clients[self.client_id].write_message(bytes(msg_update), binary=True)
                else:
                    print("Client couldn't join")
                    return

                if game.client_1 and game.client_2:
                    mv_temp = memoryview(msg)
                    mv_temp[0] = 4
                    mv_temp[2] = game.player1_move
                    clients[game.client_1].write_message(bytes(msg), binary=True)
                    mv_temp[2] = game.player2_move
                    clients[game.client_2].write_message(bytes(msg), binary=True)

                if game.disconnected:
                    if (game.client_1 and game.client_2):
                        game.disconnected = None
            else:
                print("No existing games to check")
                msg = bytearray(b'\x02')
                msg += bytes([game_id])
                clients[self.client_id].write_message(bytes(msg), binary=True)

            

            
                

        if mv[0] == 3:
            print(f'Action: move was made, check game_state')
            game = list(filter(lambda x: x.checkClient(self.client_id), games)).pop()
            # print(self.client_id)
            # print(len(mv_data))
            game.updateGameState(mv_data)
            if game.checkGameState() != len(message) - 1:
                # print("_______")
                if(game.client_1 == self.client_id):
                    game.player1_move = mv[1]
                    if (game.player1_move):
                        game.player2_move = 0
                    else:
                        game.player2_move = 1
                if(game.client_2 == self.client_id):
                    game.player2_move = mv[1]
                    if (game.player2_move):
                        game.player1_move = 0
                    else:
                        game.player1_move = 1

                # print(game.player1_move, game.player2_move)
                # print("_______")
                msg = bytearray(b'\x03')
                msg += bytes([game.player1_move])
                msg += mv_data
                clients[game.client_1].write_message(bytes(msg), binary=True)
                test = memoryview(msg)
                # print(test[1])
                msg = bytearray(b'\x03')
                msg += bytes([game.player2_move])
                msg += mv_data
                clients[game.client_2].write_message(bytes(msg), binary=True)
                test = memoryview(msg)
                # print(test[1])

        if mv[0] == 5:
            game_id = mv[1]
            try:
                game = list(filter(lambda x: x.checkSeat(game_id), games)).pop()
                msg = bytearray(b'\x05')
                msg += bytes([game_id])
                msg += bytes([1])
                clients[self.client_id].write_message(bytes(msg), binary=True)
            except IndexError:
                msg = bytearray(b'\x05')
                msg += bytes([game_id])
                msg += bytes([0])
                clients[self.client_id].write_message(bytes(msg), binary=True)

        
        


    def on_close(self):
        print("Closing connection of client: ", self.client_id)
        try:
            game = list(filter(lambda x: x.checkClient(self.client_id), games)).pop()
        except IndexError as e:
            # print(e)
            return

        game.clear_client(self.client_id)
        clients.pop(self.client_id, None)
        max_clients.append(self.client_id)

        if not game.client_1 and not game.client_2:
            print("Removing game")
            games.remove(game)
        
        if game.client_1 or game.client_2:
            game.disconnected = self.client_id

        print("GAME STATUS CLIENTS: ", game.client_1, game.client_2)
            

        
        

        

    def check_origin(self, origin):
        print("ORIGIN: ", origin)
        return True


if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/game", htmlRequesthandler),
        (r"/game/ws", gamewebSocketHandler),
    ], **settings)

    app.listen(8888)
    tornado.ioloop.IOLoop.instance().start()