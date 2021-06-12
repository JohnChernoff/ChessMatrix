let range_games = document.getElementById("range_games");
let chk_shade = document.getElementById("chkShade");
let chk_pieces = document.getElementById("chkPieces");
let chk_control = document.getElementById("chkControl");
let select_scheme = document.getElementById("selectScheme");
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
let board_size;
let edge_col = [0,0,0];
let unfitted = true;

function resize() {
  canvas.height = window.innerHeight - 36;
  canvas.style.height = canvas.height + "px";
  canvas.width = window.innerWidth - 16;
  canvas.style.width = canvas.width + "px";
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  console.log("Resizing to: " + canvas.width + "," + canvas.height);
  if (running) fitBoardsToScreen();
}

function fitBoardsToScreen() {
  num_games = range_games.valueAsNumber; //console.log("Games: " + num_games);
  let n = Math.floor(Math.sqrt(num_games));
  let board_num = 0;
  let long_length = canvas.width > canvas.height ? canvas.width : canvas.height;
  let short_length = canvas.width > canvas.height ? canvas.height : canvas.width;
  let rows = n;
  let max_cols = num_games/rows;
  board_size = Math.floor(Math.min(long_length/max_cols,short_length/rows));
  for (let row = 0; row < rows; row++) {
    let cols = Math.floor(long_length / board_size);
    let padding = long_length / cols;
    for (let i = 0; i<cols; i++) {
      if (canvas.width > canvas.height) game_list[board_num].canvas_loc = { x: padding * i , y: board_size * row };
      else game_list[board_num].canvas_loc = { y: board_size * row , x: padding * i };
      if (++board_num >= num_games) return;
    }
  }
  unfitted = false;
}

function drawBoards() {
  if (running) {
    resize();
    for (let i=0; i<num_games; i++) drawBoard(game_list[i]);
  }
}

function drawBoard(board) {
  if (unfitted) fitBoardsToScreen();
  let square_width = Math.floor(board_size / 8), square_height = Math.floor(board_size / 8);
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      board.matrix[rank][file].control = getControl(rank,file,board.matrix);
      board.matrix[rank][file].color = getColor(board.matrix[rank][file]);
    }
  }
  if (chk_shade.checked) {
    linearInterpolateBoard(board,square_width,square_height);
  }
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      let squareX = board.canvas_loc.x + (file * square_width), squareY = board.canvas_loc.y + (rank * square_height);
      if (!chk_shade.checked) {
        ctx.fillStyle = board.matrix[rank][file].color;
        ctx.fillRect(squareX, squareY, square_width, square_height);
      }

      if (chk_pieces.checked) {
        if (board.matrix[rank][file].piece > 0 ) ctx.fillStyle = "cyan";
        else if (board.matrix[rank][file].piece < 0 ) ctx.fillStyle = "orange";
        else ctx.fillStyle = "green";
        ctx.fillText(piece_chars.charAt(Math.abs(board.matrix[rank][file].piece)+6),
        squareX + square_width/2 ,squareY + square_height/4);
      }

      if (chk_control.checked) {
        ctx.fillStyle = "yellow";
        ctx.fillText(""+ board.matrix[rank][file].control,squareX + square_width/2 ,squareY + square_height/1.5);
      }

      ctx.strokeStyle = "rgb(24,24,24)"; ctx.strokeRect(board.canvas_loc.x,board.canvas_loc.y,board_size,board_size);
    }
  }
}

function inBounds(x,y) { return (x >= 0 && y >= 0 && x < 8 && y < 8); }

function linearInterpolateBoard(board,square_width,square_height) {
  //console.log("Drawing board at: " + board.canvas_loc.x + "," + board.canvas_loc.y);
  let board_width = square_width * 8, board_height = square_height * 8;
  let padded_board_width = square_width * 10, padded_board_height = square_height * 10;
  let pixArray = [];
  for (let h=0; h < (padded_board_height); h++) {
    pixArray[h] = [];
    for (let w=0; w < (padded_board_width); w++) {
      pixArray[h][w] = [];
      for (let i = 0; i < 3; i++) pixArray[h][w][i] = 0;
    }
  }
  let w2 = Math.floor(square_width/2), h2 = Math.floor(square_height/2);
  for (let mx = -1; mx < 8; mx++)
  for (let my = -1; my < 8; my++) {
    let x = Math.floor(((mx+1) * square_width) + w2), y = Math.floor(((my+1) * square_height) + h2);
    let c1 = inBounds(my,mx) ? rgb2array(board.matrix[my][mx].color) : edge_col;
    let c2 = inBounds(my,mx+1) ? rgb2array(board.matrix[my][mx+1].color) : edge_col;
    let c3 = inBounds(my+1,mx) ? rgb2array(board.matrix[my+1][mx].color) : edge_col;
    let c4 = inBounds(my+1,mx+1) ? rgb2array(board.matrix[my+1][mx+1].color): edge_col;
    //console.log("colors: " + c1 + "," + c2 + "," + c3 + "," + c4);
    for (let i = 0; i < 3; i++) {
      for (let x1 = 0; x1 < square_width; x1++) {
        let v = x1/square_width;
        let ly = y + square_height;
        let x2 = x+x1;
        //interpolate right
        pixArray[y][x2][i] = Math.floor(lerp(v,c1[i],c2[i]));
        //console.log("x/y: " + x +"," + y + ", x1: " + x1 + ", v:" + v);
        //console.log(i + " upper pixel value: " + pixArray[y][x2][i] + ", " + c1[i] + " -> " + c2[i]);
        //interpolate right and below
        pixArray[ly][x2][i] = Math.floor(lerp(v,c3[i],c4[i]));
        //console.log(i + " lower pixel value: " + pixArray[ly][x2][i] + ", " + c3[i] + " -> " + c4[i]);
        //interpolate down
        for (let y1 = 0; y1 < square_height; y1++) {  //console.log("y:" + y + " -> " + ly);
          let y2 = y + y1;
          pixArray[y2][x2][i] = Math.floor(lerp(y1/square_height,pixArray[y][x2][i],pixArray[ly][x2][i]));
        }
      }
    }
  }
  let img_data = ctx.createImageData(board_width,board_height);
  let pixels = img_data.data;
  let px2, py2, off;
  for (let px = 0; px < board_height; px++) {
    for (let py = 0; py < board_width; py++) {
      off = (px * img_data.width + py) * 4;
      px2 = px + square_width; py2 = py + square_height;
      pixels[off] = pixArray[px2][py2][0];
      pixels[off + 1] = pixArray[px2][py2][1];
      pixels[off + 2] = pixArray[px2][py2][2];
      pixels[off + 3] = 255;
    }
  }
  ctx.putImageData(img_data,board.canvas_loc.x,board.canvas_loc.y);
}

function lerp(v, start, end) {
  return (1 - v) * start + v * end;
}

function getColor(square) { //console.log("Scheme: " + select_scheme.value);
  switch (select_scheme.value) {
    case 'COLOR_SCHEME_BLUE_RED': return getRedBlueColor(square);
    case 'COLOR_SCHEME_MULTI_HUE': return getMultiHueColor(square);
    case 'COLOR_SCHEME_MONO': return getGrayscale(square);
  }
}

function getRedBlueColor(square) {
  let control_grad = 128 / MAX_CONTROL;
  let c = square.control * control_grad;
  if (square.piece < 0) return rgb(128 - c,0,0);
  else if (square.piece > 0)  return rgb(0,0,128 + c);
  else {
    if (c < 0) return rgb(-c,0,0); else return rgb(0,0,c);
  }
}

function getMultiHueColor(square) {
  let control_grad = 128 / MAX_CONTROL;
  let g = (square.control === undefined ? 32 : 128 + (square.control * control_grad));
  let piece_grad = 128/6;
  let c = 128 + (Math.abs(square.piece) * piece_grad);
  if (square.piece < 0) return rgb(c,g,0);
  else if (square.piece > 0) return rgb(0,g,c);
  else return rgb(0,g,0);
}

function getGrayscale(square) {
  let i = 128/MAX_CONTROL; let v = 128 + (square.control * i);
  return rgb(v,v,v);
}

function rgb(r, g, b){
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  return ["rgb(",r,",",g,",",b,")"].join("");
}

function rgb2array(rgb) {
  return rgb.match(/\d+/g);
}
