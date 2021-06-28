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
let anim_test = false;

for (let i=0; i<6; i++) {
  piece_imgs[i] = { black: new Image(), white: new Image() }; //onload?
  piece_imgs[i].black.src = "img/pieces/b" + (i+1) + ".svg";
  piece_imgs[i].white.src = "img/pieces/w" + (i+1) + ".svg";
}
boardLoop(); //TODO: maybe place in onload of all images?

canvas.addEventListener("mousedown", event => {
  if (playing) {
    if (play_board.result === ResultEnum.ONGOING) {
      let status_size = play_board_size / status_percent;
      let sz2 = status_size/2;
      let board_size = play_board_size - status_size;
      let square_size = (board_size/8);
      let x = Math.floor(8 / (board_size/(event.pageX)));
      let y = Math.floor(8 / (board_size/(event.pageY - sz2 - document.getElementById("sidebar").clientHeight)));
      ctx.strokeStyle = "white";
      ctx.strokeRect(x * square_size,sz2 + (y * square_size),square_size,square_size);
      let click_square = getAlgebraic(play_board.black_pov ? 7 - x : x,play_board.black_pov ? y : 7 - y);
      if (from_click === null) from_click = click_square;
      else {
        to_click = click_square;
        makeMove(from_click+to_click);
        from_click = to_click = null;
      }
    }
    else setPlaying(false);
  }
  else {
    let board = getObsBoardFromClick(event); if (board !== null)  {
      if (anim_test) {
        board.result = ResultEnum.DRAW; board_queue.push(board);
      }
      else {
        clearBoard(board); setBoards();
      }
    }
  }
});

function getObsBoardFromClick(event) {
  for (let i=0; i<board_list.length; i++) {
    if (inBounds(event.pageX ,event.pageY,  {
      x1: board_list[i].canvas_loc.x, y1: board_list[i].canvas_loc.y,
      x2: obs_board_size, y2: obs_board_size
    })) return board_list[i];
  }
  return null;
}

function resize() {
  canvas.height = window.innerHeight - document.getElementById("sidebar").clientHeight;
  canvas.style.height = canvas.height + "px";
  canvas.width = window.innerWidth - 16;
  canvas.style.width = canvas.width + "px";
  play_board_size = Math.min(canvas.width,canvas.height);
  console.log("Resizing to: " + canvas.width + "," + canvas.height);
  if (watching) drawBoards();
}

function clearScreen() {
  ctx.fillStyle = background_color;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function fitBoardsToScreen() { //console.trace();
  //num_boards = range_games.valueAsNumber; console.log("Games: " + board_list.length);
  board_queue = [];  unfitted = false;
  let n = Math.floor(Math.sqrt(board_list.length));
  let board_num = 0;
  let long_length = canvas.width > canvas.height ? canvas.width : canvas.height; //TODO: use Math.min,max
  let short_length = canvas.width > canvas.height ? canvas.height : canvas.width;
  let rows = n;
  let max_cols = board_list.length/rows;
  obs_board_size = Math.floor(Math.min(long_length/max_cols,short_length/rows)) * .95;
  for (let row = 0; row < rows; row++) {
    let cols = Math.floor(long_length / obs_board_size);
    let padding1 = long_length / cols, padding2 = short_length/rows;

    for (let i = 0; i<cols; i++) {
      if (canvas.width > canvas.height) board_list[board_num].canvas_loc = { x: padding1 * i , y: padding2 * row };
      else board_list[board_num].canvas_loc = { y: padding2 * row , x: padding1 * i };
      if (++board_num >= board_list.length) return;
      else console.log("Fitting Board #" + board_num + " : " + board_list[board_num]);
    }
  }
}

function boardLoop() {
  if (board_queue.length > 0) {
    let board = board_queue.shift();
    if (!board.fin) drawBoard(board);
  }
  requestAnimationFrame(boardLoop);
  //setTimeout(() => { requestAnimationFrame(boardLoop); }, 120);
}

function rndPiece() {
  let p = 0; while (p === 0) { p = Math.floor((Math.random() * 12)-6); }
  return p;
}

function rndColor() {
  return rgb(Math.random() * 255,Math.random() * 255,Math.random() * 255);
}

function getBoardNumber(board) {
  for (let n = 0; n < board_list.length; n++) if (board.info.id === board_list[n].info.id) return n;
  return -1;
}

function drawBoards() {
  fitBoardsToScreen(); clearScreen();
  if (playing) board_queue.push(play_board);
  else if (watching) { for (let i=0; i<board_list.length; i++) board_queue.push(board_list[i]); }
}

function getBoardDim(board) {
  let board_size = (playing ? play_board_size : obs_board_size);
  let status_size = board_size/status_percent; let sz2 = status_size/2;
  let board_y = board.canvas_loc.y + sz2;
  let board_width = board_size - status_size, board_height = board_size - status_size;
  let square_width = (board_width / 8), square_height = (board_height / 8);
  return {
    board_size: (board_size), status_size: (status_size), sz2: (sz2),
    board_x: (board.canvas_loc.x), board_y: (board_y),
    board_width: (board_width), board_height: (board_height),
    square_width: (square_width), square_height: (square_height)
  }
}

function drawBoard(board) {
  if (board.fin) { console.log("Ignoring board #" + getBoardNumber(board)); return; } //shouldn't occur
  if (playing) {
    if (!board.playing) return; //!playing and board.playing is OK
    clearScreen(); board.canvas_loc.x = 0; board.canvas_loc.y = 0;
  }
  else if (unfitted) fitBoardsToScreen();
  let board_dim = getBoardDim(board);
  if (board.result !== ResultEnum.ONGOING) {  //console.log("Animating: " + getBoardNumber(board));
    animateBoard(board,board_dim);
    if (!board.fin) board_queue.push(board);
    return;
  }
  calculateColorControl(board);
  if (chk_shade.checked) linearInterpolateBoard(board.matrix,board_dim);
  drawSquares(board.matrix,board_dim,!chk_shade.checked,chk_pieces.checked,chk_control.checked,true);
  drawStatus(board,board_dim);
  let move = getMoveInfo(board); //console.log(board.last_move + " : " + JSON.stringify(move));
  drawMoveArrow(move,board.black_pov,board_dim);
  playMove(move);
}

function calculateColorControl(board) {
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      board.matrix[rank][file].control = getControl(rank,file,board);
      board.matrix[rank][file].color = getColor(board.matrix[rank][file]);
    }
  }
}

function playMove(move) {
  if (move !== null) {
    let fromPitch = 24 + (move.from.y * 8) + move.from.x;
    let toPitch = 24 + (move.to.y * 8) + move.to.x;
    let volume = (document.getElementById("range_" + move.type).valueAsNumber/100) * .5;
    if (move.type == INST_CAPTURE || move.type === INST_CASTLING) {
      playNote(orchestra[move.type],0,fromPitch,1,volume);
      playNote(orchestra[move.type],0,toPitch,1,volume);
    }
    else {
      let d = 8 / (7 - Math.abs(move.piece));
      addNoteToQueue(orchestra[INST_MELODY],fromPitch,d,volume);
      volume = (document.getElementById("range_" + INST_HARMONY).valueAsNumber/100) * .5;
      playNote(orchestra[INST_HARMONY],0,toPitch,8,volume);
    }
  }
}

function drawMoveArrow(move,black_pov,board_dim) {
  if (move !== null) {
    if (black_pov) {
      move.from.x = 7 - move.from.x;  move.from.y = 7 - move.from.y;  move.to.x = 7 - move.to.x;  move.to.y = 7 - move.to.y;
    }
    let x1 = board_dim.board_x + (move.from.x * board_dim.square_width) + (board_dim.square_width/2)
    let y1 = board_dim.board_y + (move.from.y * board_dim.square_height) + (board_dim.square_height/2);
    let x2 = board_dim.board_x + (move.to.x * board_dim.square_width) + (board_dim.square_width/2)
    let y2 = board_dim.board_y + (move.to.y * board_dim.square_height) + (board_dim.square_height/2);
    ctx.strokeStyle = "gray";
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.stroke(); ctx.closePath();
    ctx.beginPath();
    ctx.arc(x1,y1,8,0,Math.PI * 2,false);
    ctx.stroke(); //drawArrowhead(ctx,{x: x1, y: y1}, {x: x2, y: y2},8);
  }
}

function getWinPrefix(board) {
  let black_prefix, white_prefix;
  switch(board.result) {
    case ResultEnum.BLACK:
      black_prefix = "1.0 -> "; white_prefix = "0.0 -> "; break;
    case ResultEnum.WHITE:
      black_prefix = "0.0 -> "; white_prefix = "1.0 -> "; break;
    case ResultEnum.DRAW:
      black_prefix = "0.5 -> "; white_prefix = "0.5 -> "; break;
    case ResultEnum.ABORT:
      black_prefix = "* -> "; white_prefix = "* -> "; break;
    default:
      black_prefix = ""; white_prefix = "";
  }
  return { black: black_prefix, white: white_prefix };
}

function drawStatus(board,board_dim) {
  ctx.fillStyle = board.turn === (board.black_pov ? "w" : "b") ? "green" : "brown";
  ctx.fillRect(board_dim.board_x,board_dim.board_y - board_dim.sz2,board_dim.board_width,board_dim.sz2);
  ctx.fillStyle = board.turn === (board.black_pov ? "b" : "w") ? "green" : "brown";
  ctx.fillRect(board_dim.board_x,board_dim.board_y + board_dim.board_height,board_dim.board_width,board_dim.sz2);
  let info = getBoardInfo(board);
  ctx.fillStyle = "black";
  ctx.font = 'bold ' + (board_dim.sz2/1.5) + 'px fixedsys'; let fontpad = board_dim.sz2/4;
  let top_y = board_dim.board_y - fontpad, bottom_y = (board_dim.board_y + board_dim.sz2 + board_dim.board_height) - fontpad;
  let pfx = getWinPrefix(board);
  let black_txt = pfx.black + info.black.name + "(" + info.black.rating + ") : " + sec2hms(board.clock.black,info.initial_time);
  let white_txt = pfx.white + info.white.name + "(" + info.white.rating + ") : " + sec2hms(board.clock.white,info.initial_time);
  ctx.fillText(black_txt, board_dim.board_x + centerText(black_txt,board_dim.board_width),board.black_pov ? bottom_y : top_y);
  ctx.fillText(white_txt, board_dim.board_x + centerText(white_txt,board_dim.board_width),board.black_pov ? top_y : bottom_y);
}

function drawSquares(matrix,board_dim,blocks,pieces,control,grid) {
  let piece_width = board_dim.square_width/2, piece_height = board_dim.square_height/2;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      let squareX = board_dim.board_x + (file * board_dim.square_width);
      let squareY = board_dim.board_y + (rank * board_dim.square_height);

      if (blocks) {
        ctx.fillStyle = matrix[rank][file].color;
        ctx.fillRect(squareX, squareY, board_dim.square_width, board_dim.square_height);
      }

      if (pieces) {
        let p = matrix[rank][file].piece;
        if (p !== 0) { //console.log("Drawing: " + p + " at " + rank + "," + file);
          if (p < 0) ctx.drawImage(piece_imgs[Math.abs(p)-1].black,squareX +
            (board_dim.square_width/4),squareY + (board_dim.square_height/4),piece_width,piece_height);
          else ctx.drawImage(piece_imgs[Math.abs(p)-1].white,squareX +
            (board_dim.square_width/4),squareY + (board_dim.square_height/4),piece_width,piece_height);
        }
      }

      if (control) {
        ctx.fillStyle = "yellow";
        ctx.fillText(""+ matrix[rank][file].control,
          squareX + board_dim.square_width/2 ,squareY + board_dim.square_height/1.5);
      }

      if (grid) {
        ctx.strokeStyle = "rgb(128,128,128)";
        ctx.strokeRect(squareX+2,squareY+2,board_dim.square_width-4,board_dim.square_height-4);
      }
    }
  }
}

function getAlgebraic(x,y) {
  return String.fromCharCode(('a'.charCodeAt(0) + x)) + "" + (y+1);
}

function getMoveInfo(board) { //console.log(board.last_move);
  let lastPosition = board.history[board.history.length-2];
  if (board.last_move.length > 0) {
    let from = {
      x: (board.last_move.charCodeAt(0) - 'a'.charCodeAt(0)),
      y: (8 - (board.last_move.charCodeAt(1) - '0'.charCodeAt(0)))
    };
    let to = {
      x: (board.last_move.charCodeAt(2) - 'a'.charCodeAt(0)),
      y: (8 - (board.last_move.charCodeAt(3) - '0'.charCodeAt(0)))
    };
    let piece = board.black_pov ? board.matrix[7-to.y][7-to.x].piece : board.matrix[to.y][to.x].piece;
    let captured_piece = board.black_pov ? lastPosition[7-to.y][7-to.x].piece : lastPosition[to.y][to.x].piece;
    //console.log("Captured: " + captured_piece);
    let type = INST_MELODY;
    if (captured_piece !== 0) type = INST_CAPTURE;
    else if (piece === 0) type = INST_CASTLING;
    //TODO: add checks
    return {
      from: from,
      to: to,
      type: type,
      piece: piece
    }
  }
  else return null;
}

function matrix2str(matrix) {
  let str = "";
  for (let y=0;y<8;y++) {
    str += "\n";
    for (let x=0;x<8;x++) {
      str += " " + PIECE_CHRS[matrix[x][y].piece + 6];
    }
  }
  return str;
}

function centerText(text, maxWidth) {
  let x = (maxWidth / 2) - ctx.measureText(text).width/2;
  if (x < 0) return 0; else return x;
}

function inBounds(x,y,rect) {
  return (x >= rect.x1 && y >= rect.y1 && x < (rect.x1 + rect.x2) && y < (rect.y1 + rect.y2));
}

function linearInterpolateBoard(matrix,board_dim) {
  let square_width = Math.round(board_dim.square_width);
  let square_height = Math.round(board_dim.square_height);
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
  let img_data = ctx.createImageData(board_dim.board_width,board_dim.board_height);
  let pixels = img_data.data;
  let px2, py2, off;
  for (let px = 0; px < board_dim.board_height; px++) {
    for (let py = 0; py < board_dim.board_width; py++) {
      off = (px * img_data.width + py) * 4;
      px2 = px + square_width; py2 = py + square_height;
      pixels[off] = pixArray[px2][py2][0];
      pixels[off + 1] = pixArray[px2][py2][1];
      pixels[off + 2] = pixArray[px2][py2][2];
      pixels[off + 3] = 255;
    }
  }
  ctx.putImageData(img_data,board_dim.board_x,board_dim.board_y);
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

function rgb2IntArray(color) {
  let a = []; let rgb = rgb2array(color);
  a[0] = parseInt(rgb[0]); a[1] = parseInt(rgb[1]); a[2] = parseInt(rgb[2]);
  return a;
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
