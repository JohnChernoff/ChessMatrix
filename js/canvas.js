let range_games = document.getElementById("range_games");
let chk_shade = document.getElementById("chkShade");
let chk_pieces = document.getElementById("chkPieces");
let chk_control = document.getElementById("chkControl");
let select_scheme = document.getElementById("selectScheme");
let canvas = document.getElementById("main_canvas");
let ctx = canvas.getContext("2d");
let board_size;
let board_loc = [];

function resize() {
  canvas.height = window.innerHeight - 36;
  canvas.style.height = canvas.height + "px";
  canvas.width = window.innerWidth - 16;
  canvas.style.width = canvas.width + "px";
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  console.log("Resizing to: " + canvas.width + "," + canvas.height);
}

function fitBoardsToScreen() {
  num_games = range_games.valueAsNumber; console.log("Games: " + num_games);
  board_loc = [num_games];
  let n = Math.floor(Math.sqrt(num_games));
  let board = 0;
  let long_length = canvas.width > canvas.height ? canvas.width : canvas.height;
  let short_length = canvas.width > canvas.height ? canvas.height : canvas.width;
  let rows = n;
  let max_cols = Math.floor(num_games/rows);
  board_size = Math.floor(Math.min(long_length/max_cols,short_length/rows));
  for (let row = 0; row < rows; row++) {
    let cols = Math.floor(long_length / board_size);
    let padding = long_length / cols;
    for (let i = 0; i<cols; i++) {
      if (canvas.width > canvas.height) board_loc[board] = { x: padding * i , y: board_size * row };
      else board_loc[board] = { y: board_size * row , x: padding * i };
      if (++board >= num_games) return;
    }
  }
}

function drawBoard(game_index) {
  if (game_index === undefined) resize();
  fitBoardsToScreen();
  let square_width = Math.floor(board_size / 8), square_height = Math.floor(board_size / 8);

  for (let i=0; i<board_loc.length; i++) {
    if (game_index === undefined || (i === game_index && i < num_games)) {
      if (game_list[i] !== undefined) {
        if (chk_shade.checked) {
          linearInterpolateBoard(game_list[i].matrix,square_width,square_height,board_loc[i].x,board_loc[i].y);
        }
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            let squareX = board_loc[i].x + (file * square_width), squareY = board_loc[i].y + (rank * square_height);
            let control = getControl(rank, file, game_list[i].matrix);
            if (chk_shade.checked) {
              //shadeSquare(game_list[i].matrix, file, rank, squareX, squareY, square_width, square_height, control);
            }
            else {
              ctx.fillStyle = getColor(game_list[i].matrix[rank][file], control);
              ctx.fillRect(squareX, squareY, square_width, square_height);
            }
            if (chk_pieces.checked) {
              if (game_list[i].matrix[rank][file] > 0 ) ctx.fillStyle = "cyan";
              else if (game_list[i].matrix[rank][file] < 0 ) ctx.fillStyle = "orange";
              else ctx.fillStyle = "green";
              ctx.fillText(piece_chars.charAt(Math.abs(game_list[i].matrix[rank][file])+6),
                squareX + square_width/2 ,squareY + square_height/4);
            }
            if (chk_control.checked) {
              ctx.fillStyle = "yellow";
              ctx.fillText(""+ control,squareX + square_width/2 ,squareY + square_height/1.5);
            }
          }
        }
        ctx.strokeStyle = "rgb(24,24,24)"; ctx.strokeRect(board_loc[i].x,board_loc[i].y,board_size,board_size);
      }
    }
    else {
      ctx.strokeStyle = game_list[i] === undefined ? "blue" : (game_list[i].fin ? "white" : rgb(24,24,24));
      ctx.strokeRect(board_loc[i].x,board_loc[i].y,board_size,board_size);
    }
  }
}

function linearInterpolateBoard(matrix,square_width,square_height,offX,offY) {
  let board_width = square_width * 8, board_height = square_height * 8;
  let pixArray = [];
  for (let h=0; h < (square_height * 8); h++) {
    pixArray[h] = [];
    for (let w=0; w < (square_width * 8); w++) {
      pixArray[h][w] = [];
      for (let i = 0; i < 3; i++) pixArray[h][w][i] = 0;
    }
  }
  let w2 = Math.floor(square_width/2), h2 = Math.floor(square_height/2);
  for (let mx = 0; mx < 7; mx++)
  for (let my = 0; my < 7; my++) {
    let x = Math.floor((mx * square_width) + w2), y = Math.floor((my * square_height) + h2);
    let c1 = rgb2array(getColor(matrix[my][mx],getControl(my,mx,matrix))); //"255,0,0");
    let c2 = rgb2array(getColor(matrix[my][mx+1],getControl(my,mx+1,matrix))); //"0,0,255");
    let c3 = rgb2array(getColor(matrix[my+1][mx],getControl(my+1,mx,matrix))); //"0,255,0");
    let c4 = rgb2array(getColor(matrix[my+1][mx+1],getControl(my+1,mx+1,matrix))); //"255,255,0");
    //console.log("colors: " + c1 + "," + c2 + "," + c3 + "," + c4);
    for (let i = 0; i < 3; i++) {
      for (let x1 = 0; x1 < square_width; x1++) {
        let v = x1/square_width;
        let ly = y + square_height;
        let x2 = x+x1;
        //interpolate right
        pixArray[y][x2][i] = Math.floor(lerp(v,c1[i],c2[i]));
        //console.log("x/y: " + x +"," + y + ", x1: " + x1 + ", v:" + v);
        //console.log(i + " upper pixel value: " + pixArray[x+x1][y][i] + ", " + c1[i] + " -> " + c2[i]);
        //interpolate right and below
        pixArray[ly][x2][i] = Math.floor(lerp(v,c3[i],c4[i]));
        //console.log(i + " lower pixel value: " + pixArray[x+x1][ly][i] + ", " + c3[i] + " -> " + c4[i]);
        //interpolate down
        //console.log("y:" + y + " -> " + ly);
        for (let y1 = 0; y1 < square_height; y1++) {
          pixArray[y + y1][x2][i] = Math.floor(lerp(y1/square_height,pixArray[y][x2][i],pixArray[ly][x2][i]));
        }
      }
    }
  }
  let img_data = ctx.createImageData(board_width,board_height);
  let pixels = img_data.data;
  for (let px = 0; px < board_height; px++) {
    for (let py = 0; py < board_width; py++) {
      let off = (px * img_data.width + py) * 4;
      pixels[off] = pixArray[px][py][0];
      pixels[off + 1] = pixArray[px][py][1];
      pixels[off + 2] = pixArray[px][py][2];
      pixels[off + 3] = 255;
    }
  }
  ctx.putImageData(img_data,offX,offY);
}

function lerp(v, start, end) {
  return (1 - v) * start + v * end;
}

function shadeSquare(matrix,file,rank,squareX,squareY,square_width,square_height,control) {
  let w2 = square_width/2, h2 = square_height/2;
  let x1 = file * square_width, y1 = rank * square_height;
  let img_data = ctx.createImageData(square_width,square_height);
  let pixels = img_data.data;
  for (let x2 = 0; x2 < square_width; x2++) {
    for (let y2 = 0; y2 < square_height; y2++) {
      let x = x1 + x2, y = y1 + y2;
      let c = rgb2array(calcColor(matrix,x,y,file,rank,square_width,square_height,w2,h2,control));
      let off = (y2 * img_data.width + x2) * 4;
      pixels[off] = c[0];
      pixels[off + 1] = c[1];
      pixels[off + 2] = c[2];
      pixels[off + 3] = 255;
    }
  }
  ctx.putImageData(img_data,squareX,squareY);
}

function calcColor(matrix,x,y,file,rank,square_width,square_height,w2,h2,control) {
  let x2,y2;
  let neighbours = [];
  for (let my = rank - 1; my <= rank + 1; my++) {
    for (let mx = file - 1; mx <= file + 1; mx++) {
      if (mx >= 0 && my >= 0 && mx < 8 && my < 8) {
        x2 = (mx * square_width) + w2; y2 = (my * square_height) + h2;
        let xDist = Math.abs(x-x2), yDist = Math.abs(y-y2);
        let dist = Math.sqrt(Math.pow(xDist,2) + Math.pow(yDist,2));
        neighbours.push({ color: rgb2array(getColor(matrix[my][mx],control)), distance: dist });
      }
    }
  }
  neighbours.sort(function compare(a,b) { return a.distance - b.distance; });
  let weights = 0, red_sum = 0, green_sum = 0, blue_sum = 0;
  for (let i=0; i<4; i++) {
    let d = 1/neighbours[i].distance;
    red_sum += (neighbours[i].color[0] * d);
    green_sum += (neighbours[i].color[1] * d);
    blue_sum += (neighbours[i].color[2] * d);
    weights += d;
  }
  return rgb((red_sum/weights),(green_sum/weights),(blue_sum/weights));
}

function getColor(p,control) { //console.log("Scheme: " + select_scheme.value);
  switch (select_scheme.value) {
    case 'COLOR_SCHEME_BLUE_RED': return getRedBlueColor(p,control);
    case 'COLOR_SCHEME_MULTI_HUE': return getMultiHueColor(p,control);
    case 'COLOR_SCHEME_MONO': return getGrayscale(control);
  }
}

function getRedBlueColor(p,control) {
  let control_grad = 128 / MAX_CONTROL;
  let c = control * control_grad;
  if (p < 0) return rgb(128 - c,0,0);
  else if (p > 0)  return rgb(0,0,128 + c);
  else {
    if (c < 0) return rgb(-c,0,0); else return rgb(0,0,c);
  }
}

function getMultiHueColor(p,control) {
  let control_grad = 128 / MAX_CONTROL;
  let g = (control === undefined ? 32 : 128 + (control * control_grad));
  let piece_grad = 128/6;
  let c = 128 + (Math.abs(p) * piece_grad);
  if (p < 0) return rgb(c,g,0);
  else if (p > 0) return rgb(0,g,c);
  else return rgb(0,g,0);
}

function getGrayscale(control) {
  let i = 128/MAX_CONTROL; let v = 128 + (control * i);
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
