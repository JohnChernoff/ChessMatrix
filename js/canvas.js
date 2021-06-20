const RED = 0, GREEN = 1, BLUE = 2;
let range_games = document.getElementById("range_games");
let chk_shade = document.getElementById("chkShade");
let chk_pieces = document.getElementById("chkPieces");
let chk_control = document.getElementById("chkControl");
let select_scheme = document.getElementById("selectScheme");
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
let obs_board_size, play_board_size;
let edge_col = [0,0,0];
let unfitted = true;
let piece_imgs = [];
let background_color = "black";
let from_click = null, to_click = null;
let status_percent = 10;
let board_queue = [];

for (let i=0; i<6; i++) {
  piece_imgs[i] = { black: new Image(), white: new Image() }; //onload?
  piece_imgs[i].black.src = "img/pieces/b" + (i+1) + ".svg";
  piece_imgs[i].white.src = "img/pieces/w" + (i+1) + ".svg";
}
boardLoop(); //TODO: maybe place in onload of all images?

canvas.addEventListener("mousedown", event => {
  if (playing) {
    if (play_game.winner == null) {
      let status_size = play_board_size / status_percent;
      let sz2 = status_size/2;
      let board_size = play_board_size - status_size;
      let square_size = (board_size/8);
      let x = Math.floor(8 / (board_size/(event.pageX)));
      let y = Math.floor(8 / (board_size/(event.pageY - sz2 - document.getElementById("sidebar").clientHeight)));
      ctx.strokeStyle = "white";
      ctx.strokeRect(x * square_size,sz2 + (y * square_size),square_size,square_size);
      let click_square = getAlgebraic(x,7-y);
      if (from_click === null) from_click = click_square;
      else {
        to_click = click_square;
        makeMove(from_click+to_click);
        from_click = to_click = null;
      }
    }
    else {
      play_game.fin = true; playing = false; clearScreen(); initGames("blitz",false);
    }
  }
  else {
    let board = getObsBoardFromClick(event);
    if (board !== null) { //board.winner = "Zug"; board_queue.push(board);
      board.fin = true; initGames("blitz",false);
    }
  }
});

function getObsBoardFromClick(event) {
  for (let i=0; i<num_games; i++) {
    if (inBounds(event.pageX ,event.pageY,  {
      x1: game_list[i].canvas_loc.x, y1: game_list[i].canvas_loc.y,
      x2: obs_board_size, y2: obs_board_size
    })) return game_list[i];
  }
  return null;
}

function resize() {
  canvas.height = window.innerHeight - document.getElementById("sidebar").clientHeight;
  canvas.style.height = canvas.height + "px";
  canvas.width = window.innerWidth - 16;
  canvas.style.width = canvas.width + "px";
  play_board_size = Math.min(canvas.width,canvas.height);
  clearScreen(); console.log("Resizing to: " + canvas.width + "," + canvas.height);
  //if (observing) fitBoardsToScreen();
}

function clearScreen() {
  ctx.fillStyle = background_color;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function fitBoardsToScreen() {
  num_games = range_games.valueAsNumber; //console.log("Games: " + num_games);
  let n = Math.floor(Math.sqrt(num_games));
  let board_num = 0;
  let long_length = canvas.width > canvas.height ? canvas.width : canvas.height; //TODO: use Math.min,max
  let short_length = canvas.width > canvas.height ? canvas.height : canvas.width;
  let rows = n;
  let max_cols = num_games/rows;
  obs_board_size = Math.floor(Math.min(long_length/max_cols,short_length/rows)) * .95;
  for (let row = 0; row < rows; row++) {
    let cols = Math.floor(long_length / obs_board_size);
    let padding1 = long_length / cols, padding2 = short_length/rows;

    for (let i = 0; i<cols; i++) {
      if (canvas.width > canvas.height) game_list[board_num].canvas_loc = { x: padding1 * i , y: padding2 * row };
      else game_list[board_num].canvas_loc = { y: padding2 * row , x: padding1 * i };
      if (++board_num >= num_games) return;
    }
  }
  unfitted = false;
}

function boardLoop() {
  if (board_queue.length > 0) {
    let board = board_queue.pop(); //TODO: retain this for redrawing
    if (!board.fin) drawBoard(board);
  }
  requestAnimationFrame(boardLoop);
  //setTimeout(() => { requestAnimationFrame(boardLoop); }, 120);
}

function animateBoard(board,board_x,board_y,board_width,board_height,square_width,square_height) {
  //animateBigLife(board,board_x,board_y,board_width,board_height);
  animateBoardLife(board,board_x,board_y,board_width,board_height,square_width,square_height);
  //animateBoardMosh(board,board_x,board_y,board_width,board_height,square_width,square_height);
}

function animateBoardMosh(board,board_x,board_y,board_width,board_height,square_width,square_height) {
  board.moshing = true;
  let rx = Math.floor(Math.random() * 8), ry = Math.floor(Math.random() * 8);
  if (Math.random() < .5) board.matrix[rx][ry].piece = 0; else board.matrix[rx][ry].piece = rndPiece();
  board.matrix[rx][ry].control = getControl(rx,ry,board.matrix);
  board.matrix[rx][ry].color = getColor(board.matrix[rx][ry]);
  linearInterpolateBoard(board.matrix,board_x,board_y,square_width,square_height);
  ctx.fillStyle = rndColor();
  ctx.font = 'bold ' + (board_height/12) + 'px fixedsys';
  ctx.fillText("Winner: ",board.canvas_loc.x + centerText("winner",board_width), board.canvas_loc.y + board_height/3);
  ctx.fillText(board.winner,board.canvas_loc.x + centerText(board.winner,board_width), board.canvas_loc.y + board_height/1.5);
}

function animateBoardLife(board,board_x,board_y,board_width,board_height,square_width,square_height) {
  if (board.board_life === undefined) {
    board.board_life = true; board.square_cells = []; board.square_tmp_cells = [];
    for (let rank=0;rank<8;rank++) {
      board.square_cells[rank] = []; board.square_tmp_cells[rank] = [];
      for (let file=0;file<8;file++) {
        board.square_cells[rank][file] = { alive: (board.matrix[rank][file].piece !== 0), age: 0 };
        board.square_tmp_cells[rank][file] = { alive: (board.matrix[rank][file].piece !== 0), age: 0 };
        if (board.matrix[rank][file].piece === 0) board.matrix[rank][file].old_piece = Math.random() < .5 ? 6 : -6;
        else board.matrix[rank][file].old_piece = board.matrix[rank][file].piece > 0 ? 6 : -6;
        //if (board.matrix[rank][file].old_piece === 0) board.matrix[rank][file].old_piece = rndPiece();
      }
    }
  }

  for (let rank=0;rank<8;rank++) {
    for (let file=0;file<8;file++) {
      board.matrix[rank][file].color = getColor(board.matrix[rank][file],"COLOR_SCHEME_BLUE_RED2");
      board.square_cells[rank][file].alive = board.square_tmp_cells[rank][file].alive;
      board.square_cells[rank][file].age =  board.square_tmp_cells[rank][file].age;
      if (board.square_cells[rank][file].alive) board.matrix[rank][file].piece = board.matrix[rank][file].old_piece;
      else board.matrix[rank][file].piece = 0;
    }
  }

  linearInterpolateBoard(board.matrix,board_x,board_y,square_width,square_height);
  //drawSquares(board.matrix,board_x,board_y,square_width,square_height,false,true,false);
  nextTick(board.square_cells,board.square_tmp_cells,128);
}

function rndPiece() {
  let p = 0; while (p === 0) { p = Math.floor((Math.random() * 12)-6); }
  return p;
}

function rndColor() {
  return rgb(Math.random() * 255,Math.random() * 255,Math.random() * 255);
}

function animateBigLife(board,board_x,board_y,board_width,board_height) {
  if (board.big_life === undefined) {
    board.big_life = true; board.big_cells = []; board.big_tmp_cells = [];
    board.pixels = ctx.getImageData(board_x,board_y,board_width,board_height);
    for (let x=0;x<board.pixels.width;x++) {
      board.big_cells[x] = []; board.big_tmp_cells[x] = [];
      for (let y=0;y<board.pixels.height;y++) {
        board.big_cells[x][y] = { alive: false, age: 0 }; board.big_tmp_cells[x][y] = { alive: false, age: 0 };
        let i = (x * board.pixels.width + y) * 4;
        let avg_col = (board.pixels.data[i] + board.pixels.data[i+1] + board.pixels.data[i+2]) / 3;
        if (avg_col > 92) board.big_cells[x][y].alive = true;
      }
    }
  }
  nextTick(board.big_cells,board.big_tmp_cells,255);
  updateBigLife(board.big_cells,board.big_tmp_cells,board.pixels);
  ctx.putImageData(board.pixels,board_x,board_y);
}

function updateBigLife(cells,tmp_cells,pixels) { //let age_factor = 128/max_age;
  for (let x=0; x<cells.length-1; x++) {
    for (let y=0; y<cells[x].length-1; y++) {
      cells[x][y].alive = tmp_cells[x][y].alive;
      cells[x][y].age = tmp_cells[x][y].age;
      let i = (x * pixels.width + y) * 4;
      if (cells[x][y].alive) {
        pixels.data[i] = 255;
        pixels.data[i+1] = 0;
      }
      else {
        pixels.data[i] = 0;
        pixels.data[i+1] = 255;
      }
      pixels.data[i+2] = cells[x][y].age;
      pixels.data[i+3] = 255;
    }
  }
}

function nextTick(cells,tmp_cells,max_age) {
  let max_x = cells.length-1; let x,y,x1,y1,max_y,n,nx,ny;
  for (x = 0; x <= max_x; x++) {
    max_y = cells[x].length-1;
    for (y = 0; y <= max_y; y++) {
      n = 0;
      for (nx = x-1; nx <= x+1; nx++) {
        for (ny = y-1; ny <= y+1; ny++) {
          x1 = nx; y1 = ny;
          if (x1 < 0 ) x1 = max_x; else if (x1 > max_x) x1 = 0;
          if (y1 < 0 ) y1 = max_y; else if (y1 > max_y) y1 = 0;
          if ((x1 !== x || y1 !== y) && cells[x1][y1].alive) n++;
        }
      }
      tmp_cells[x][y] = {
        age: cells[x][y].age + 1,
        alive: isAlive(cells[x][y],n,max_age)
      };
      if (tmp_cells[x][y].alive !== cells[x][y].alive) tmp_cells[x][y].age = 0;
    }
  }
}

function isAlive(cell,neighbours,max_age) {
  if (cell.alive) return (neighbours > 1 && neighbours < 4 && cell.age < max_age);
  else return (neighbours === 3 || cell.age > max_age);
}

function getBoardNumber(board) {
  for (let n = 0; n < game_list.length; n++) if (board.info.id === game_list[n].info.id) return n;
  return -1;
}

function drawBoards() {
  if (observing) { clearScreen(); for (let i=0; i<num_games; i++) board_queue.push(game_list[i]); }
}

function centerText(text, maxWidth) {
  let x = (maxWidth / 2) - ctx.measureText(text).width/2;
  if (x < 0) return 0; else return x;
}

function drawBoard(board) {
  if (board.fin) { console.log("Ignoring board #" + getBoardNumber(board)); return; } //shouldn't occur
  if (playing) {
    if (!board.playing) return; //!playing and board.playing is OK
    clearScreen(); board.canvas_loc.x = 0; board.canvas_loc.y = 0;
  }
  else if (unfitted) fitBoardsToScreen();

  let board_size = playing ? play_board_size : obs_board_size;
  let status_size = board_size/status_percent;
  let board_width = board_size - status_size, board_height = board_size - status_size;
  let board_x = board.canvas_loc.x, board_y = board.canvas_loc.y + (status_size/2);
  let square_width = (board_width / 8), square_height = (board_height / 8);

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      board.matrix[rank][file].control = getControl(rank,file,board.matrix);
      board.matrix[rank][file].color = getColor(board.matrix[rank][file]);
    }
  }

  if (board.winner !== null) {  //console.log("Animating: " + getBoardNumber(board));
    animateBoard(board,board_x,board_y,board_width,board_height,square_width,square_height);
    if (!board.fin) board_queue.push(board);
    return;
  }

  if (chk_shade.checked) {
    linearInterpolateBoard(board.matrix,board_x,board_y,square_width,square_height);
  }

  drawSquares(board.matrix,board_x,board_y,square_width,square_height,!chk_shade.checked,chk_pieces.checked,chk_control.checked);
  //ctx.strokeStyle = "rgb(24,24,24)"; ctx.strokeRect(board_x,board_y,board_width,board_height);

  let move = getMoveCoords(board.last_move); //console.log(move);
  if (move !== null) {
    let x1 = board_x + (move.from.x * square_width) + (square_width/2), y1 = board_y + (move.from.y * square_height) + (square_height/2);
    let x2 = board_x + (move.to.x * square_width) + (square_width/2), y2 = board_y + (move.to.y * square_height) + (square_height/2);
    ctx.strokeStyle = "gray";
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.stroke(); ctx.closePath();
    ctx.beginPath();
    ctx.arc(x1,y1,8,0,Math.PI * 2,false);
    ctx.stroke(); //drawArrowhead(ctx,{x: x1, y: y1}, {x: x2, y: y2},8);
  }

  ctx.fillStyle = "orange";
  let sz2 = status_size/2;
  ctx.fillRect(board_x,board_y - sz2,board_width,sz2);
  ctx.fillRect(board_x,board_y + board_height,board_width,sz2);

  let players = getPlayers(board);
  ctx.fillStyle = "black";
  ctx.font = 'bold ' + (sz2/1.5) + 'px fixedsys'; let fontpad = sz2/4;
  let black_txt = players.black.name + "(" + players.black.rating + ") : " + sec2hms(board.clock.black);
  ctx.fillText(black_txt, board_x + centerText(black_txt,board_width),board_y - fontpad);
  let white_txt = players.white.name + "(" + players.white.rating + ") : " + sec2hms(board.clock.white);
  ctx.fillText(white_txt, board_x + centerText(white_txt,board_width), (board_y + sz2 + board_height) - fontpad);

}

function drawSquares(matrix,board_x,board_y,square_width,square_height,blocks,pieces,control) {
  let piece_width = square_width/2, piece_height = square_height/2;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      let squareX = board_x + (file * square_width), squareY = board_y + (rank * square_height);

      if (blocks) {
        ctx.fillStyle = matrix[rank][file].color;
        ctx.fillRect(squareX, squareY, square_width, square_height);
      }

      if (pieces) {
        let p = matrix[rank][file].piece;
        if (p !== 0) { //console.log("Drawing: " + p + " at " + rank + "," + file);
          if (p < 0) ctx.drawImage(piece_imgs[Math.abs(p)-1].black,squareX + (square_width/4),squareY + (square_height/4),piece_width,piece_height);
          else ctx.drawImage(piece_imgs[Math.abs(p)-1].white,squareX + (square_width/4),squareY + (square_height/4),piece_width,piece_height);
        }
      }

      if (control) {
        ctx.fillStyle = "yellow";
        ctx.fillText(""+ matrix[rank][file].control,squareX + square_width/2 ,squareY + square_height/1.5);
      }

      ctx.strokeStyle = "rgb(128,128,128)"; ctx.strokeRect(squareX,squareY,square_width,square_height);
    }
  }
}

function getAlgebraic(x,y) {
  return String.fromCharCode(('a'.charCodeAt(0) + x)) + "" + (y+1);
}

function getMoveCoords(move) {
  if (move !== "O-O" && move !== "O-O-O") {
    return {
      from: {
        x: move.charCodeAt(0) - 'a'.charCodeAt(0), y: 8 - (move.charCodeAt(1) - '0'.charCodeAt(0))
      },
      to: {
        x: move.charCodeAt(2) - 'a'.charCodeAt(0), y: 8 - (move.charCodeAt(3) - '0'.charCodeAt(0))
      }
    }
  }
  else return null;
}

function inBounds(x,y,rect) {
  return (x >= rect.x1 && y >= rect.y1 && x < (rect.x1 + rect.x2) && y < (rect.y1 + rect.y2));
}

function linearInterpolateBoard(matrix,board_x,board_y,sqr_w,sqr_h) {
  let square_width = Math.round(sqr_w); let square_height = Math.round(sqr_h);
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
  let rect = { x1: 0, y1: 0, x2: 8, y2: 8 };
  let w2 = Math.floor(square_width/2), h2 = Math.floor(square_height/2);
  for (let mx = -1; mx < 8; mx++)
    for (let my = -1; my < 8; my++) {
      let x = Math.floor(((mx+1) * square_width) + w2), y = Math.floor(((my+1) * square_height) + h2);
      let c1 = inBounds(my,mx,rect) ? rgb2array(matrix[my][mx].color) : edge_col;
      let c2 = inBounds(my,mx+1,rect) ? rgb2array(matrix[my][mx+1].color) : edge_col;
      let c3 = inBounds(my+1,mx,rect) ? rgb2array(matrix[my+1][mx].color) : edge_col;
      let c4 = inBounds(my+1,mx+1,rect) ? rgb2array(matrix[my+1][mx+1].color): edge_col;
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
  ctx.putImageData(img_data,board_x,board_y);
}

function lerp(v, start, end) {
  return (1 - v) * start + v * end;
}

function getColor(square,scheme) {
  switch (scheme !== undefined ? scheme : select_scheme.value) {
    case 'COLOR_SCHEME_BLUE_RED': return getTwoColor(square,RED,GREEN,BLUE);
    case 'COLOR_SCHEME_BLUE_RED2': return getTriColor(square,RED,GREEN,BLUE);
    case 'COLOR_SCHEME_GREEN_RED': return getTwoColor(square,RED,BLUE,GREEN);
    case 'COLOR_SCHEME_GREEN_RED2': return getTriColor(square,RED,BLUE,GREEN);
    case 'COLOR_SCHEME_BLUE_GREEN': return getTwoColor(square,GREEN,RED,BLUE);
    case 'COLOR_SCHEME_BLUE_GREEN2': return getTriColor(square,GREEN,RED,BLUE);
    case 'COLOR_SCHEME_MONO': return getGrayscale(square);
    default: return getGrayscale(square);
  }
}

function getTwoColor(square,blackColor,voidColor,whiteColor) {
  let color_matrix = [];
  let control_grad = 256 / MAX_CONTROL;
  let c = square.control * control_grad;
  if (c < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = 0; color_matrix[whiteColor] = 0;
  }
  else {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = 0; color_matrix[whiteColor] = Math.abs(c);
  }
  return rgb(color_matrix[0],color_matrix[1],color_matrix[2]);
}

function getTriColor(square,blackColor,voidColor,whiteColor) {
  let color_matrix = [];
  let control_grad = 256 / MAX_CONTROL;
  let c = square.control * control_grad;
  let piece_grad = 128/6;
  let pc = 128 + (piece_grad * square.piece);

  if (square.piece < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = pc; color_matrix[whiteColor] = 0;
  }
  else if (square.piece > 0) {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = pc; color_matrix[whiteColor] = Math.abs(c);
  }
  else if (c < 0) {
    color_matrix[blackColor] = Math.abs(c); color_matrix[voidColor] = 0; color_matrix[whiteColor] = 0;
  }
  else {
    color_matrix[blackColor] = 0; color_matrix[voidColor] = 0; color_matrix[whiteColor] =  Math.abs(c);
  }
  return rgb(color_matrix[0],color_matrix[1],color_matrix[2]);
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

//thanks to www.jwir3.com for this snippet
function drawArrowhead(context, from, to, radius) {
  let x_center = to.x;
  let y_center = to.y;
  let angle, x, y;

  context.beginPath();

  angle = Math.atan2(to.y - from.y, to.x - from.x)
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.moveTo(x, y);

  angle += (1.0/3.0) * (2 * Math.PI);
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.lineTo(x, y);

  angle += (1.0/3.0) * (2 * Math.PI);
  x = radius * Math.cos(angle) + x_center;
  y = radius * Math.sin(angle) + y_center;

  context.lineTo(x, y); context.closePath(); context.fill();
}
