const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

var STARTFLAG = {
    create_game: 0,
    first_create: 0
}
var field_state = new ArrayBuffer(101);

function serverUpdateField(id){
    let x = field_state[id][0];
    let y = field_state[id][1];
    // console.log("testing hard!!!", x,y);
    if(ball.is_legall(id)){
        update_field(id, ball.ball_id);
        ball.moves_array.push([x, y, id]);
        ball.update_position(x, y, id);
    }
    else{
        console.log("Illegal move");
    }
}

function clearFieldState(){
    let x = field_state[0][0];
    // console.log(x);
    for (var i=0; i<field_state.byteLength; i++){
        for (var j=0; j<field_state[i][0].byteLength; j++){
            field_state[i][2][j] = 0;
        }
    }
}

function move(){
    // array example: 0 0 0 (x-1)(1 - y + 1)
    //field state id  0 x 0 (x)(1 - y + 1)
    //                0 0 0 (x + 1)( 1 - y + 1 )

    let id = $(this).attr('id').split('_')[1];
    let x = field_state[id][0];
    let y = field_state[id][1];

    // console.log("before update ball:" , field_state[ball.ball_id][2])
    // console.log("before update move state: ", field_state[id][2])
    if(ball.is_legall(id) && ball.ball_move){
        ball.check_bounce(id)
        update_field(id, ball.ball_id);
        ball.moves_array.push([x, y, id]);
        // console.log("after update ball:" , field_state[ball.ball_id][2])
        ball.update_position(x, y, id);
        // console.log("after update move state: ", field_state[id][2])
        // console.log("-----------------------------------")
        APP.updateGameState()
    }
    else{
        console.log("Illegal move", id, ball.ball_id, ball.ball_move);
    }
    // console.log(ball.moves_array);
}



function update_field(move_id, ball_id){
    let diff = ball_id - move_id;
    switch(diff){
        case 8:
            field_state[ball_id][2][0] = 1 
            break;
        case 9:
            field_state[ball_id][2][1] = 1 
            break;
        case 10:
            field_state[ball_id][2][2] = 1 
            break;
        case 1:
            field_state[ball_id][2][3] = 1 
            break;
        case 0:
            field_state[ball_id][2][4] = 1 
            break;
        case -1:
            field_state[ball_id][2][5] = 1 
            break;
        case -8:
            field_state[ball_id][2][6] = 1 
            break;
        case -9:
            field_state[ball_id][2][7] = 1 
            break;
        case -10:
            field_state[ball_id][2][8] = 1 
            break;
    }

    let diffv2 = move_id - ball_id;
    switch(diffv2){
        case 8:
            field_state[move_id][2][0] = 1 
            break;
        case 9:
            field_state[move_id][2][1] = 1 
            break;
        case 10:
            field_state[move_id][2][2] = 1 
            break;
        case 1:
            field_state[move_id][2][3] = 1 
            break;
        case 0:
            field_state[move_id][2][4] = 1 
            break;
        case -1:
            field_state[move_id][2][5] = 1 
            break;
        case -8:
            field_state[move_id][2][6] = 1 
            break;
        case -9:
            field_state[move_id][2][7] = 1 
            break;
        case -10:
            field_state[move_id][2][8] = 1 
            break;
    }
}


const fitToContainer = (canvas) => {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };

  fitToContainer(canvas);

class BallField{
    constructor(x, y, height_, width_, color) {
        this.x = x;
        this.y = y;
        this.height = height_;
        this.width = width_;
        this.color = color;
        this.button
    }

    draw_lines(){
        c.moveTo(this.x, this.y)
        for(var i = this.x; i<=this.width;){
            c.lineTo(i,this.height);
            i = i + 100;
            c.moveTo(i, this.y);
        }
        c.moveTo(this.x, this.y);

        for(var i = this.y; i<=this.height;){
            c.lineTo(this.x + this.width,i);
            i = i + 100;
            c.moveTo(this.x, i);
        }


        c.moveTo(this.x + 400, this.y);
        c.lineTo(this.x + 400, this.y - 100);

        c.moveTo(this.x + 400, this.y + this.height - 50);
        c.lineTo(this.x + 400, this.y + this.height - 150);

        c.strokeStyle = '#808080';
        c.lineWidth = 2;
        c.stroke();
    }

    create_goal(goal_id, x, y){
                let btn = document.createElement("button");
                btn.type = "button"
                btn.className = "field_buttons";
                btn.id = "id_" + goal_id;
                btn.innerHTML = "goal_" + goal_id;
                btn.onclick = move;
                let row = $("<div>", {"class": "row pad-top"});
                let col = $("<div>", {"class": "col", "id": btn.id});
                let input_group = $("<div>",{"class":"input-group goal"});
                input_group.append(btn);
                col.append(input_group);
                row.append(col);
                field_state[goal_id] = [x,y,[0,0,0,0,0,0,0,0,0]];
                $("#field_items").append(row);
    }

    create_btns(){
        var x_cord = 0;
        var y_cord = 0;
        var id = 0;
        let row, col;
        this.create_goal(99, canvas.width / 2, this.y - 100);
        for (var i = this.y; i<=this.height;){
            row = $("<div>", {"class": "row pad-top"});
            for (var j = this.x; j<=this.width + 100;){
                let btn = document.createElement("button");
                btn.type = "button"
                btn.className = "field_buttons";
                btn.id = "id_" + id;
                btn.innerHTML = x_cord.toString() + "_" + y_cord.toString();
                btn.onclick = move;
                col = $("<div>", {"class": "col", "id": btn.id});
                let input_group = $("<div>",{"class":"input-group"});
                input_group.append(btn);
                col.append(input_group);
                row.append(col);
                field_state[id] = [j,i,[0,0,0,0,0,0,0,0,0]];
                j = j + 100;
                y_cord = y_cord + 1;
                id = id + 1;
                
            }
            $("#field_items").append(row);
            y_cord = 0;
            i = i + 100;
            x_cord = x_cord + 1;

        }
        this.create_goal(100, canvas.width / 2, this.y + this.height - 50);
    }

    draw() {
        c.lineWidth = 5;
        const goal_center_width = this.x + ( this.width / 2 ) - 175;
        c.moveTo(this.x, this.y);
        c.lineTo(this.x + goal_center_width, this.y);
        c.lineTo(this.x + goal_center_width, this.y - 100 );
        c.lineTo(this.x + goal_center_width + 200, this.y - 100);
        c.lineTo(this.x + goal_center_width + 200, this.y);
        c.lineTo(this.x + this.width, this.y);
        c.lineTo(this.x + this.width, this.height);
        c.lineTo(this.x + goal_center_width + 200, this.height);
        c.lineTo(this.x + goal_center_width + 200, this.height + 100);
        c.lineTo(this.x + goal_center_width, this.height + 100);
        c.lineTo(this.x + goal_center_width, this.height);
        c.lineTo(this.x, this.height);
        c.lineTo(this.x, this.y);
        c.strokeStyle = '#000000';
        c.stroke()
        this.draw_lines();
    }
}

class Ball{
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.x_center = x;
        this.y_center = y;
        this.radius = radius;
        this.color = color;

        this.moves_array = [];
        this.ball_id = 49;
        this.ball_move = 0;
        this.values_dict = {
            "8": 0,
            "9": 1,
            "10": 2,
            "1": 3,
            "0": 4,
            "-1": 5,
            "-8": 6,
            "-9": 7,
            "-10": 8
        }


    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()

        if(this.moves_array.length > 0){
            c.moveTo(this.x_center, this.y_center);
            for (var i=0; i<this.moves_array.length;i++){
                c.lineTo(this.moves_array[i][0], this.moves_array[i][1]);
                c.strokeStyle = '#000000';
                c.stroke();
            }
        }
    }

    update_position(x, y, id){
        this.x = x;
        this.y = y;
        this.ball_id = id
    }

    is_legall(move_id){
        let diff = this.ball_id - move_id;

        let bool_bl = (3 == this.ball_id || 4 == this.ball_id || 5 == this.ball_id ||
                        93 == this.ball_id || 94 == this.ball_id || 95 == this.ball_id);
        let bool_mvid = (99 == move_id || 100 == move_id);

        if(bool_bl && bool_mvid){
            console.log("ANKARA MESSI ANKARA MESII GOOAAAL GOAALLL")
            STARTFLAG = 0;
            return true
        }
        else if ((diff.toString() in this.values_dict)){
        return !field_state[this.ball_id][2][this.values_dict[diff.toString()]] // from ball perspective return true if specific field //is not occupied
        }
        else{
            return false
        }
    }

    check_bounce(id){
        let connections = field_state[id][2]
        for (var i=0; i < connections.length; i++){
            if(connections[i]){
                this.ball_move = 1;
                break;
            }
            else{
                this.ball_move = 0;
            }
        }
    }

}

function animate(){
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    field.draw()
    ball.draw()
}

const field = new BallField(75, 150, canvas.height - 150, canvas.width - 150, 'red');
const x_center = (canvas.width) / 2;
const y_center = (canvas.height) / 2
const ball = new Ball(x_center, y_center, 15, 'black');

function drawGame(){
    if(STARTFLAG.create_game){
        if($('.pad-top').length == 0 ){
            field.create_btns();
            STARTFLAG.first_create = 1;
        }
        animate()
    }
}
