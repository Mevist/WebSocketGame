var APP = {
  wsURL: 'ws://' + window.location.host + window.location.pathname + '/ws',
  connected: false,
  myTurn: false,
  gameOn: false,
  gameId: null,

  sendMessage: function(data){
    APP.socket.send(data);
  },

  init: function() {
    APP.socket = new WebSocket(APP.wsURL)
    APP.socket.binaryType = "arraybuffer"


    APP.socket.onopen = function(event) {
      APP.connected = true;
      let localstorage_value = localStorage.getItem("gameID")
      var buffer = new ArrayBuffer(2)
      var dv = new DataView(buffer)
      dv.setUint8(0,5)
      dv.setUint8(1, localstorage_value)
      APP.socket.send(buffer)
      // if (localstorage_value){
      //   APP.joinGame(localstorage_value)
      // }
    };

    APP.socket.onclose = function(event) {
      APP.connected = false;
      console.log("CLOSING!!!!!!!!!")
      // APP.gameEnded();  // Game Ended - Disconnected from Server

    };

    APP.socket.onerror = function(error) {
      APP.connected = false;
      APP.gameOn = false;
      // APP.messageUpdate('Connection Error');
    };

    APP.socket.onmessage = function(event) {
      var payload = event.data
      var dv = new DataView(payload)
      var dv_data = new DataView(payload, 2)
      // // console.log(payload)
      // console.log(dv.getUint8(0))
      switch(dv.getUint8(0)){
        case 0:
          APP.gameId = dv.getUint8(1)
          APP
          console.log("Game is created", APP.gameId.toString() + " as player 1");
          $("#template_print").text("Game id: " + APP.gameId.toString() + " as player 1");
          $("#game_status").text("Waiting....");
          STARTFLAG.create_game = 1;
          localStorage.setItem('gameID', APP.gameId.toString())
          drawGame();
          break;
        case 1:
          var old_gameid = APP.gameId;
          APP.gameId = dv.getUint8(1);
          ball.ball_move = dv.getUint8(2);
          if(old_gameid != null && old_gameid != APP.gameId && STARTFLAG.first_create){
            ball.moves_array = [];
            clearFieldState();
            console.log("You joined a game", APP.gameId.toString() + " as player 2");
            $("#template_print").text("Game id: " + APP.gameId.toString() + " as player 2");
            $("#game_status").text("Waiting....");
            STARTFLAG.create_game = 1;
            localStorage.setItem('gameID', APP.gameId.toString())
            drawGame()
          }else{
            console.log("You joined a game", APP.gameId.toString() + " as player 2");
            $("#template_print").text("Game id: " + APP.gameId.toString() + " as player 2");
            $("#game_status").text("Waiting....");
            STARTFLAG.create_game = 1;
            localStorage.setItem('gameID', APP.gameId.toString())
            drawGame()
          }
          

          break;
          case 2:
            APP.gameId = dv.getUint8(1);
            console.log("Connection to ", APP.gameId.toString() + " failed");
            // console.log("APP", APP.gameId)
            $("#template_print").text("Connection to game with id "+ APP.gameId.toString() + " failed");
            localStorage.removeItem("gameID")
            break;
        case 3:
          ball.ball_move = dv.getUint8(1);
          console.log("Update game", dv_data.byteLength, ball.moves_array.length, ball.ball_move)
          if (dv_data.byteLength > ball.moves_array.length) {
            if (ball.moves_array.length == 0){
              for (var i=0; i < dv_data.byteLength; i++){
                serverUpdateField(dv_data.getUint8(i))
                // console.log(dv_data.getUint8(i))
              }
            }
            else {
              for (var i=ball.moves_array.length; i < dv_data.byteLength; i++){
                serverUpdateField(dv_data.getUint8(i))
                // console.log(dv_data.getUint8(i))
              }
            }
          // console.log("after update", dv_data.byteLength, ball.moves_array.length)
          }
          break;
          case 4:
            APP.gameId = dv.getUint8(1);
            console.log("Starting a game", APP.gameId.toString());
            $("#template_print").text(" ");
            $("#game_status").text("Game id: " + APP.gameId.toString() + " started");
            STARTFLAG.create_game = 1;
            ball.ball_move = dv.getUint8(2);
            localStorage.setItem('gameID', APP.gameId.toString())
            drawGame()
          break;
          case 5:
            if (dv.getUint8(2)){
              APP.gameId = dv.getUint8(1)
              APP.joinGame(APP.gameId)
            }
            else{
              $("#game_status").text("Game doesn't exists");
              localStorage.removeItem("gameID");
            }
            break;
      }
      // APP.serverMessage(action, data);
    };
  },

  updateGameState: function(){
    if(ball.moves_array.length > 0){
      let buffer_resizeVal = 2;
      var buffer = new ArrayBuffer(ball.moves_array.length + buffer_resizeVal);
      var dv = new DataView(buffer);
      dv.setUint8(0, 3);
      dv.setUint8(1, ball.ball_move)
      for (var i=2; i < ball.moves_array.length + buffer_resizeVal; i++){
        dv.setUint8(i, ball.moves_array[i-buffer_resizeVal][2])
        // console.log("ball move id", dv.getUint8(i))
      }
      // console.log("____________________");
      APP.sendMessage(buffer)
     }
  },
  
  // requestGameState: function(){

  // }



  createGame: function(){
    if (!APP.connected) {
      APP.init();
    }
    var buffer = new ArrayBuffer(2);
    var dv = new DataView(buffer);
    dv.setUint16(0, 0);
    APP.sendMessage(buffer);
    APP.updateGameState();
  },

  joinGame: function(gameid_){
    if (!APP.connected) {
      console.log("connecting....")
      APP.init();
    }
    var buffer = new ArrayBuffer(2);
    var dv = new DataView(buffer);
    dv.setUint8(0, 1);
    dv.setUint8(1, gameid_)
    console.log("attempt to send a msg")
    APP.sendMessage(buffer)
  }
}

function convert_data(){
 if(ball.moves_array.length > 0){
  var buffer = new ArrayBuffer(ball.moves_array.length)
  var dv = new DataView(buffer)

  for (var i=0; i < ball.moves_array.length; i++){
    // console.log("ball move id", ball.moves_array[i][2])
    dv.setUint8(i, ball.moves_array[i][2])
  }
  return buffer;
 }
}

APP.init()

window.addEventListener('load', function () {
  // alert("It's loaded!")
})

$("#create_game").click(function() {
  APP.createGame()
});

$("#join_game").click(function() {
  gameid_input = $('#gameid_input').val()
  // console.log(gameid_input)
  APP.joinGame(gameid_input)
});