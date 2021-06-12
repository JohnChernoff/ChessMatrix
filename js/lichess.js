const NO_GAME = -1; //const FEN_SUFFIX = " - - 1 1";
let piece_chars = "kqrbnp-PNBRQK";
let num_games = 15;
let game_list = []; game_list.length = num_games; //let game_list_tmp = [];
let lich_sock = null;
let queue = [];
let msg_loop = null;
let running = false;

function initAllGames() {
  //initGames("bullet");
  initGames("blitz");
  //initGames("rapid");
}

function initGames(type) {
  fetch("http://localhost:5000/games/" + type,{ headers:{'Accept':'application/json'}})
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(json => { //console.log("JSON: " + json);
      for (let i = 0; i<json.gids.length; i++) {
        let gid = json.gids[i], state = json.states[i]; //console.log("Init State: " + state);
        if (gid !== null && getGame(gid) === NO_GAME) {
          console.log("Adding: " + gid);
          for (let game_idx = 0; game_idx < game_list.length; game_idx++) {
            if (game_list[game_idx] === undefined || game_list[game_idx].fin) {
              console.log("At index: " + game_idx);
              game_list[game_idx] = {
                fin : false, gid : gid, matrix : initMatrix(state), canvas_loc : { x : 0, y : 0 }
              };
              send(lich_sock, JSON.stringify({ t: 'startWatching', d: gid }));
              break;
            }
          }
        }
      }
      running = true; //resize();
    });
}

function closeSock() {
  lich_sock.close(); running = false;
}

function initMatrix(fen) {
  let matrix = [];
  for (let x=0;x<8;x++) {
    matrix[x] = []; for (let y=0;y<8;y++) {
      matrix[x][y] = { piece: 0, color: [0,0,0], control: 0 };
    }
  }
  let ranks = fen.split(" ")[0].split("/");
  for (let rank = 0; rank < ranks.length; rank++) {
    let file = 0;
    for (let i = 0; i < ranks[rank].length; i++) {
      let char = ranks[rank].charAt(i);
      let piece = piece_chars.indexOf(char);
      if (piece === -1) file += parseInt(char); else matrix[rank][file++].piece = piece - 6;
    }
  }
  return matrix;
}

function getGame(gid) { //if (game_list === undefined) return null;
  for (let i=0;i<game_list.length;i++) if (game_list[i] !== undefined && game_list[i].gid === gid) return i;
  return NO_GAME;
}

function send(sock, message) {
  if (sock.readyState === 1) sock.send(message); else queue.push(message);
}

function toggleStart() {
  if (lich_sock === null) runLichessSocket(); else closeSock();
}

function runLichessSocket() {

  document.getElementById("sockButt").innerText = "Stop";
  lich_sock = new WebSocket('wss://socket.lichess.org/api/socket');

  lich_sock.onopen = function () {
    console.log("Connected to Lichess...");
    initAllGames();
    queue = [];
    msg_loop = setInterval(function() {
      if (lich_sock.readyState === 1 && queue.length > 0) lich_sock.send(queue.pop());
    },1000);
  }

  lich_sock.onerror = function (error) { console.error("Oops: " + error); }

  lich_sock.onmessage = function (e) { //console.log(("Message: ") + e.data);
    let data = JSON.parse(e.data);
    if (data.t) { //console.log(data);
      if (data.d.id) {
        let i = getGame(data.d.id);
        if (i > NO_GAME) {
          if (data.t === "fen") {
            game_list[i].matrix = initMatrix(data.d.fen);
            if (i < num_games) drawBoard(game_list[i]);
          }
          else if (data.t === "finish") {
            console.log("Game finished: " + game_list[1].gid);
            game_list[i].fin = true;
            initAllGames();
          }
        }
      }
    }
  }

  lich_sock.onclose = function () {
    console.log("Socket closed");
    clearInterval(msg_loop);
    lich_sock = null;
    document.getElementById("sockButt").innerText = "Start";
    for (let i=0; i<game_list.length; i++) game_list[i] = undefined;
  }

}

function dumpGames() {
  for (let i=0;i<game_list.length;i++) if (game_list[i] !== undefined) console.log(i + ": " + game_list[i].gid);
}

