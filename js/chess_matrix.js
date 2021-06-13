const EMPTY = 0, PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
const MAX_CONTROL = 4;

function getControl(x,y,matrix) {
  let control = 0;
  control += knightControl(x,y,matrix);
  control += diagControl(x,y,matrix);
  control += lineControl(x,y,matrix);
  return control;
}

function knightControl(x1,y1,matrix) {
  let control = 0;
  for (let x2 = -2; x2 <= 2; x2++)
  for (let y2 = -2; y2 <= 2; y2++) {
    if ((Math.abs(x2) + Math.abs(y2)) === 3) {
      let x = x1 + x2, y = y1 + y2;
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (matrix[x][y].piece === KNIGHT) control++; else if (matrix[x][y].piece === -KNIGHT) control--;
      }
    }
  }
  return control;
}

function diagControl(x1,y1,matrix) {
  let control = 0;
  for (let dx = -1; dx <= 1; dx += 2)
  for (let dy = -1; dy <= 1; dy += 2) {
    let x = x1, y = y1;
    let clear_line = true;
    while (clear_line) {
      x += dx; y += dy; //console.log("Testing: " + x + "," + y);
      clear_line = (x >= 0 && x < 8 && y >= 0 && y < 8);
      if (clear_line) {
        if (Math.abs(matrix[x][y].piece) === BISHOP || Math.abs(matrix[x][y].piece) === QUEEN) {
          control += matrix[x][y].piece < 0 ? -1 : 1;
        }
        else if (Math.abs(x1-x) < 2 && Math.abs(y1-y) < 2) { //adjacent
          if (Math.abs(matrix[x][y].piece) === KING) {
            control += matrix[x][y].piece < 0 ? -1 : 1;
          }
          else if (matrix[x][y].piece === PAWN && x > x1) control++;
          else if (matrix[x][y].piece === -PAWN && x < x1) control--;
        }
        clear_line = (matrix[x][y].piece === EMPTY);
      }
    }
  }
  return control;
}

function lineControl(x1,y1,matrix) {
  let control = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 ^ dy === 0) {
        let x = x1, y = y1; //console.log("Testing: " + x + "," + y);
        let clear_line = true;
        while (clear_line) {
          x += dx; y += dy;
          clear_line = (x >= 0 && x < 8 && y >= 0 && y < 8);
          if (clear_line) {
            if (Math.abs(matrix[x][y].piece) === ROOK || Math.abs(matrix[x][y].piece) === QUEEN) {
              control += matrix[x][y].piece < 0 ? -1 : 1;
            }
            else if (Math.abs(x1-x) < 2 && Math.abs(y1-y) < 2) { //adjacent
              if (Math.abs(matrix[x][y].piece) === KING) {
                control += matrix[x][y].piece < 0 ? -1 : 1;
              }
            }
            clear_line = (matrix[x][y].piece === EMPTY);
          }
        }
      }
    }
  return control;
}
