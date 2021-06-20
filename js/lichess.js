const NO_GAME = -1; //const FEN_SUFFIX = " - - 1 1";
let piece_chars = "kqrbnp-PNBRQK";
let num_games = 15;
let game_list = []; game_list.length = num_games;
let play_game;
let lich_sock = null;
let queue = [];
let msg_loop = null;
let oauth;
let seek_controller, seek_signal;
let logged_in = false;
let observing = false;
let playing = false;
let start_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function setOauth() {
  oauth = window.location.search.substr(1);
  if (oauth.length > 0) {
    let token = oauth.substring(oauth.indexOf("=")+1);
    setCookie("oauth",token,180); //console.log("New oauth: " + token);
    oauth = token;
    window.history.replaceState({}, document.title,window.location.href.split('?')[0]);
  }
  else {
    oauth = getCookie("oauth");
  }
  if (oauth.length > 0) {
    logged_in = true;
    getEvents();
  }
  else console.log("Bad oauth, augh");
}

function initGames(type,init) {
  console.log("Fetching TV Games...");
  if (init) for (let i = 0; i < num_games; i++) {
    game_list[i] = newGame({ id: "DumGame" + i},start_fen,false);
    game_list[i].fin = true;
  }
  fitBoardsToScreen();
  fetch("http://lichess.org/api/tv/" + type,{
    method: "get",
    headers:{'Accept':'application/x-ndjson'}
  }).then(readStream(processNewTV)); //.then(msg => console.log("TV games fetched: " + msg));
}

function processNewTV(game) { //console.log("New TV Game : " + JSON.stringify(game));
  if (game.id !== null && getObservedGame(game.id) === NO_GAME) {
    for (let i = 0; i < game_list.length; i++) {
      if (game_list[i].fin) { console.log("Adding " + game.id + " at index: " + i);
        let prev_x = game_list[i].canvas_loc.x, prev_y = game_list[i].canvas_loc.y;
        game_list[i] = newGame(game,false);
        game_list[i].canvas_loc.x = prev_x; game_list[i].canvas_loc.y = prev_y;
        board_queue.push(snapshot(game_list[i]));
        startWatching(game.id);
        break;
      }
    }
  }
  observing = true;
}

function newGame(data,playing) {
  let fen = start_fen;
  if (data.moves !== undefined) {
    const game = new Chess(), moves = data.moves.split(" ");
    for (let i=0;i<moves.length;i++) game.move(moves[i]);
    fen = game.fen();
  }
  return {
    playing : playing,
    fin : false, matrix : initMatrix(fen), canvas_loc : { x : 0, y : 0 },
    last_move : "", clock : { white: 0, black: 0 }, winner : null, info : data
  };
}

function snapshot(board) {
  return JSON.parse(JSON.stringify(board));
}

function startWatching(gid) {
  send(lich_sock, JSON.stringify({ t: 'startWatching', d: gid }));
}

function initMatrix(fen) {
  let matrix = [];
  for (let x=0;x<8;x++) {
    matrix[x] = []; for (let y=0;y<8;y++) {
      matrix[x][y] = { piece: 0, color: [0,0,0], control: 0 };
    }
  }
  if (fen === undefined) return matrix;
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

function getObservedGame(gid) {
  for (let i=0;i<game_list.length;i++) if (game_list[i].info.id === gid) return i;
  return NO_GAME;
}

function send(sock, message) {
  if (sock.readyState === 1) sock.send(message); else queue.push(message);
}

function updateGame(board,game_data,draw) {
  board.matrix = initMatrix(game_data.fen);
  board.last_move = game_data.lm;
  board.clock = { white : game_data.wc, black : game_data.bc };
  if (draw) board_queue.push(snapshot(board));
}

function gameOver(data,board) { //console.log("Winner: " + JSON.stringify(data));
  let players = getPlayers(board);
  switch (data.d.win) {
    case "w": board.winner = players.white.name; break;
    case "b": board.winner = players.black.name; break;
    case "null": board.winner = "draw/abort"; break;
    default:  board.winner = "???";
  }
  board_queue.push(board);
}

function runLichessSocket() { //document.getElementById("sockButt").innerText = "Stop";
  lich_sock = new WebSocket('wss://socket.lichess.org/api/socket',[]);

  lich_sock.onopen = function () {
    console.log("Connected to Lichess..."); //send(lich_sock,JSON.stringify({t: 'poolIn', d: '1'}));
    queue = [];
    msg_loop = setInterval(function() {
      if (lich_sock.readyState === 1 && queue.length > 0) lich_sock.send(queue.pop());
      else lich_sock.send(" t : 0, p : 0 }");
    },2000);
    initGames("blitz",true);
  }

  lich_sock.onerror = function (error) { console.error("Oops: " + error); }

  lich_sock.onmessage = function (e) { //console.log(("Message: ") + e.data);
    let data = JSON.parse(e.data);
    if (data.t) { //console.log(data);
      if (data.d.id) { //console.log(data);
        if (playing) {
          if (play_game.info.id === data.d.id) {
            if (data.t === "fen" && play_game.winner === null) updateGame(play_game,data.d,true);
            else if (data.t === "finish") gameOver(data,play_game);
          }
        }
        else {
          let i = getObservedGame(data.d.id);
          if (i > NO_GAME) {
            if (data.t === "fen" && game_list[i].winner === null) updateGame(game_list[i],data.d,(i < num_games));
            else if (data.t === "finish" && i < num_games) gameOver(data,game_list[i]);
          }
        }
      }
    }
  }

  lich_sock.onclose = function () { //document.getElementById("sockButt").innerText = "Start";
    console.log("Socket closed");
    clearInterval(msg_loop);
    lich_sock = null;
    for (let i=0; i<game_list.length; i++) game_list[i] = undefined;
  }

}

function getEvents() {
  console.log("Getting event stream...");
  fetch("https://lichess.org/api/stream/event",{
    method: 'get',
    headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
  }).then(readStream(processLobby)).then(msg => console.log("Events done: " + msg));
}

function processLobby(event) {
  console.log("Lobby Event: " + JSON.stringify(event));
  if (event.type === "gameStart") { //console.log("Playing new game: " + event.game.id);
    fetch("https://lichess.org/api/board/game/stream/" + event.game.id, {
      method: 'get',
      headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
    }).then(readStream(processPlay));
  }
  //else if (event.type === "gameFinish") { setPlaying(false); initAllGames(); }
}

function processPlay(event) {
  console.log("Play Event: " + JSON.stringify(event));
  if (event.type === "gameFull") {
    setPlaying(true);
    play_game = newGame(event,true);
    board_queue.push(snapshot(play_game)); startWatching(play_game.info.id);
  }
}

function setPlaying(bool) {
  playing = bool; console.log("Playing: " + playing); clearScreen();
}

//(ornicar) my function readStream takes a function as argument, and returns a function that takes a response as argument and returns a Promise

const readStream = processLine => response => {
  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf = '';

  const loop = () =>
    stream.read().then(({ done, value }) => {
      if (!logged_in || done) {
        if (buf.length > 0) processLine(JSON.parse(buf));
      } else {
        const chunk = decoder.decode(value, {
          stream: true
        });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts) { //console.log(i);
          if (i) processLine(JSON.parse(i));
        }
        return loop();
      }
    });

  return loop().then(() => { }); //console.log('the stream has completed');
}

function showSeekOptions() {
  document.getElementById("modal-seek-overlay").style.display = 'block';
}

function seek() {
  seek_controller = new AbortController();
  seek_signal = seek_controller.signal;
  document.getElementById("modal-seek-overlay").style.display = 'none';
  console.log("Seeking...");
  document.getElementById("modal-seeking-overlay").style.display = 'block';
  fetch("https://lichess.org/api/board/seek",{
    method: 'post',
    signal: seek_signal,
    headers: {'Content-Type':'application/x-www-form-urlencoded','Authorization': `Bearer ` + oauth},
    body: "rated=false&time=2&increment=10"
  }).then(response => {
    let seek_reader = response.body.getReader();
    seek_reader.read().then(function processSeek({ done, value }) {
      if (!done) {
        console.log("Seek data: " + value);
        seek_reader.read().then(processSeek);
      }
      else endCurrentSeek();
    });
  }).catch(oops => { console.log("seek aborted: " + oops); }); //.finally( function() { endCurrentSeek(); } );
}

function endCurrentSeek() {
  document.getElementById("modal-seeking-overlay").style.display = 'none';
  seek_controller.abort();
}

function makeMove(move) {
  fetch("https://lichess.org/api/board/game/" + play_game.info.id + "/move/" + move, {
    method: 'post',
    headers: {'Authorization': `Bearer ` + oauth}
  }).then(res => res.text().then(text => console.log(text)));
}

function getPlayers(board) {
  let black_player = { //TODO: fix this yucky kludge
    name : board.playing ? board.info.black.name : board.info.players.black.user.id,
    rating : board.playing ? board.info.black.rating : board.info.players.black.rating,
  }
  let white_player = {
    name : board.playing ? board.info.white.name : board.info.players.white.user.id,
    rating : board.playing ? board.info.white.rating : board.info.players.white.rating,
  }
  return { black: black_player, white: white_player };
}
