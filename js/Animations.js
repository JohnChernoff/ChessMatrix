function animateBoard(board,board_dim) {
  //animateBigLife(board,board_dim);
  //animateBoardLife(board,board_dim);
  //animateBoardMosh(board,board_dim);
  animateHodge(board,board_dim);
}

function animateBoardMosh(board,board_dim) {
  board.moshing = true;
  let rx = Math.floor(Math.random() * 8), ry = Math.floor(Math.random() * 8);
  if (Math.random() < .5) board.matrix[rx][ry].piece = 0; else board.matrix[rx][ry].piece = rndPiece();
  board.matrix[rx][ry].control = getControl(rx,ry,board);
  board.matrix[rx][ry].color = getColor(board.matrix[rx][ry]);
  linearInterpolateBoard(board.matrix,board_dim);
  showWinner(board,board_dim,"white");
}

function animateBoardLife(board,board_dim) {
  if (board.board_life === undefined) {
    board.board_life = true; board.square_cells = []; board.square_tmp_cells = [];
    for (let rank=0;rank<8;rank++) {
      board.square_cells[rank] = []; board.square_tmp_cells[rank] = [];
      for (let file=0;file<8;file++) {
        board.square_cells[rank][file] = { alive: false, age: 0, control: 0 };
        board.square_tmp_cells[rank][file] = {
          alive: (board.matrix[rank][file].piece !== 0), age: 0, control: getControl(rank,file,board)
        };
        if (board.matrix[rank][file].piece === 0) board.matrix[rank][file].old_piece = rndPiece(); //Math.random() < .5 ? 2 : -2;
        else board.matrix[rank][file].old_piece = board.matrix[rank][file].piece; // > 0 ? 2 : -2;
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

  calculateControl(board);
  for (let rank=0;rank<8;rank++) for (let file=0;file<8;file++) {
    board.square_cells[rank][file].control = board.matrix[rank][file].control;
  }

  linearInterpolateBoard(board.matrix,board_dim);
  nextTick(board.square_cells,board.square_tmp_cells,128,isAliveChess);
  showWinner(board,board_dim,"white");
}

function animateBigLife(board,board_dim) {
  if (board.big_life === undefined) {
    board.big_life = true; board.big_cells = []; board.big_tmp_cells = [];
    board.pixels = ctx.getImageData(board_dim.board_x,board_dim.board_y,board_dim.board_width,board_dim.board_height);
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
  nextTick(board.big_cells,board.big_tmp_cells,255,isAlive);
  updateBigLife(board.big_cells,board.big_tmp_cells,board.pixels);
  ctx.putImageData(board.pixels,board_dim.board_x,board_dim.board_y);
  showWinner(board,board_dim,"white");
}

function updateBigLife(cells,tmp_cells,pixels) {
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

function nextTick(cells,tmp_cells,max_age,life_func) {
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
        alive: life_func(cells[x][y],n,max_age)
      };
      if (tmp_cells[x][y].alive !== cells[x][y].alive) tmp_cells[x][y].age = 0;
    }
  }
}

function isAlive(cell,neighbours,max_age) {
  if (cell.alive) return (neighbours > 1 && neighbours < 4 && cell.age < max_age);
  else return (neighbours === 3 || cell.age > max_age);
}

function isAliveChess(cell,neighbours,max_age) {
  if (cell.alive) return (neighbours > 1 && neighbours < 4 && cell.age < max_age);
  else return (Math.abs(cell.control) > 1 || neighbours === 3 || cell.age > max_age);
}

function showWinner(board, board_dim, color) {
  ctx.fillStyle = color;
  ctx.font = 'bold ' + (board_dim.board_height/12) + 'px fixedsys';
  ctx.fillText("Winner: ",
    board.canvas_loc.x + centerText("winner",board_dim.board_width), board.canvas_loc.y + board_dim.board_height/3);
  ctx.fillText(board.winner,
    board.canvas_loc.x + centerText(board.winner,board_dim.board_width), board.canvas_loc.y + board_dim.board_height/1.5);
}

function animateHodge(board,board_dim) {
  if (board.hodge === undefined) {
    board.pixels = ctx.getImageData(board_dim.board_x,board_dim.board_y,board_dim.board_width,board_dim.board_height);
    board.hodge = true;
    board.tmp_pix = [];
  }
  nextHodgeTick(board.pixels,board.tmp_pix,7,7,7, false);
  ctx.putImageData(board.pixels,board_dim.board_x,board_dim.board_y);
  drawSquares(board.matrix,board_dim,false,true,false,false);
  showWinner(board,board_dim,"blue");
}

function nextHodgeTick(pixels,tmp_pix,k1,k2,g, mono) { //let tmp_pix = pixels.data.slice();
  let hodge_range = 255;
  let colors = (mono ? 1 : 3);
  let pix = 0,A,B,S,n;
  let pix_row = pixels.width * 4;
  for (let px = 0; px <= pixels.data.length; px += 4) {
    tmp_pix[px + 3] = 255;
    for (let c = 0; c < colors; c++) {
      pix = px + c;
      if (pixels.data[pix] === 0) {
        A = 0; B = 0;
        for (let y = -pix_row; y <= pix_row + 1; y += pix_row) {
          n = pix + y;
          if (n < 0) n = pixels.data.length + n;
          else if (n > pixels.data.length) n = n - pixels.data.length;
          for (let x = -4; x <= 4; x += 4) {
            if (x !== 0 || y !== 0) {
              let row = Math.floor(n / pix_row);
              n += x;
              let row_shift = (Math.floor(n / pix_row)) - row;
              if (row_shift !== 0) n += (pix_row * row_shift);
              if (pixels.data[n] > 0) A++; else if (pixels.data[n] === 0) B++;
            }
          }
        }
        tmp_pix[pix] = Math.floor(A/k1) + Math.floor(B/k2);
        if (tmp_pix[pix] > hodge_range) tmp_pix[pix] = hodge_range;
      }
      else if (pixels.data[pix] < hodge_range) {
        A = 1; S = pixels.data[pix];
        for (let y = -pix_row; y <= pix_row + 1; y += pix_row) {
          n = pix + y;
          if (n < 0) n = pixels.data.length + n;
          else if (n > pixels.data.length) n = n - pixels.data.length;
          for (let x = -4; x <= 4; x += 4) {
            if (x !== 0 || y !== 0) {
              let row = Math.floor(n / pix_row);
              n += x;
              let row_shift = (Math.floor(n / pix_row)) - row;
              if (row_shift !== 0) n += (pix_row * row_shift);
              if (pixels.data[n] > 0) {
                A++; S += pixels.data[n];
              }
            }
          }
        }
        tmp_pix[pix] = Math.floor(S/A) + g;
        if (tmp_pix[pix] > hodge_range) tmp_pix[pix] = hodge_range;
      }
      else tmp_pix[pix] = 0;
    }
    if (mono) { tmp_pix[pix+1] = tmp_pix[pix]; tmp_pix[pix+2] = tmp_pix[pix]; }
  }
  for (let i=0;i<tmp_pix.length;i++) pixels.data[i] = tmp_pix[i];
}

function grayscale(pixels) {
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      let i = (y * 4) * pixels.width + x * 4;
      let avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
      pixels.data[i] = avg; pixels.data[i + 1] = avg; pixels.data[i + 2] = avg;
    }
  }
}
