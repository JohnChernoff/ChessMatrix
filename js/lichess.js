const NO_GAME = -1; //const FEN_SUFFIX = " - - 1 1";
let piece_chars = "kqrbnp-PNBRQK";
let num_games = 15;
let game_list = []; game_list.length = num_games;
let play_game;
let lich_sock = null;
let queue = [];
let msg_loop = null;
let oauth;
let port = 8087;
let proxyAddress = "http://chernovia.com"; //let proxyAddress = "http://localhost";
let seek_controller, seek_signal;
let logged_in = false;
let observing = false;
let playing = false;

function setOauth() {
  oauth = window.location.search.substr(1);
  if (oauth.length > 0) {
    setCookie("oauth",oauth,180);
    console.log("New oauth: " + oauth);
    window.history.replaceState({}, document.title,window.location.href.split('?')[0]);
  }
  else {
    oauth = getCookie("oauth");
  }
  if (oauth.length > 0) {
    logged_in = true;
    console.log("Getting events...");
    getEvents();
  }
  else console.log("Bad oauth, augh");
}

function initAllGames() { //clearScreen();
  if (num_games > 0) initGames("blitz");
  if (num_games > 15) initGames("bullet");
  if (num_games > 30) initGames("rapid");
}

function initGames(type) {
  fetch(proxyAddress + ":" + port + "/games/" + type,{ headers:{'Accept':'application/json'}})
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(json => { //console.log("JSON: " + JSON.stringify(json));
      for (let i = 0; i<json.gids.length; i++) {
        let gid = json.gids[i], state = json.states[i]; //console.log("Init State: " + state);
        if (gid !== null && getObservedGame(gid) === NO_GAME) {
          //console.log("Adding: " + gid);
          for (let game_idx = 0; game_idx < game_list.length; game_idx++) {
            if (game_list[game_idx] === undefined || game_list[game_idx].fin) {
              console.log("Adding " + gid + " at index: " + game_idx);
              game_list[game_idx] = newGame(gid,state,false);
              board_queue.push(snapshot(game_list[game_idx]));
              startWatching(gid);
              break;
            }
          }
        }
      }
      observing = true; //resize();
    });
}

function newGame(gid,fen,playing) {
  let game = {
    playing : playing,
    fin : false, gid : gid, matrix : initMatrix(fen), canvas_loc : { x : 0, y : 0 }, last_move : "", clock : { white: 0, black: 0 }, winner : null, info : null
  };

  fetch("https://lichess.org/game/export/" + gid + "?moves=false&pgnInJson=true&clocks=false&evals=false&opening=false",
    {
      headers:{'Accept':'application/json'}
    }).then(response => response.text()).then(text => JSON.parse(text)).then(json => { game.info = json; });

  return game;
}

function snapshot(board) {
  return JSON.parse(JSON.stringify(board));
}

function startWatching(gid) {
  send(lich_sock, JSON.stringify({ t: 'startWatching', d: gid }));
}

function closeSock() {
  lich_sock.close(); observing = false;
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
  for (let i=0;i<game_list.length;i++) if (game_list[i] !== undefined && game_list[i].gid === gid) return i;
  return NO_GAME;
}

function send(sock, message) {
  if (sock.readyState === 1) sock.send(message); else queue.push(message);
}

function toggleStart() {
  if (lich_sock === null) runLichessSocket(); else closeSock();
}

function updateGame(board,game_data,draw) {
  board.matrix = initMatrix(game_data.fen);
  board.last_move = game_data.lm;
  board.clock = { white : game_data.wc, black : game_data.bc };
  if (draw) board_queue.push(snapshot(board));
}

function gameOver(data,board) { //console.log("Winner: " + JSON.stringify(data));
  switch (data.d.win) {
    case "w": board.winner = board.info.players.white.user.id; break;
    case "b": board.winner = board.info.players.black.user.id; break;
    case "null": board.winner = "draw/abort"; break;
    default:  board.winner = "???";
  }
  board_queue.push(board);
}

function runLichessSocket() { //document.getElementById("sockButt").innerText = "Stop";
  lich_sock = new WebSocket('wss://socket.lichess.org/api/socket',[]);

  lich_sock.onopen = function () {
    console.log("Connected to Lichess..."); //send(lich_sock,JSON.stringify({t: 'poolIn', d: '1'}));
    initAllGames();
    queue = [];
    msg_loop = setInterval(function() {
      if (lich_sock.readyState === 1 && queue.length > 0) lich_sock.send(queue.pop());
      else lich_sock.send(" t : 0, p : 0 }");
    },2000);
  }

  lich_sock.onerror = function (error) { console.error("Oops: " + error); }

  lich_sock.onmessage = function (e) { //console.log(("Message: ") + e.data);
    let data = JSON.parse(e.data);
    if (data.t) { //console.log(data);
      if (data.d.id) { //console.log(data);
        if (playing) {
          if (play_game.gid === data.d.id) {
            if (data.t === "fen") updateGame(play_game,data.d,true);
            else if (data.t === "finish") gameOver(data,play_game);
          }
        }
        else {
          let i = getObservedGame(data.d.id);
          if (i > NO_GAME) {
            if (data.t === "fen") updateGame(game_list[i],data.d,(i < num_games));
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
  fetch("https://lichess.org/api/stream/event",{
    method: 'get',
    headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
  }).then(readStream(processEvent)); //.then(console.log("Events done!"));
}

function processEvent(event) {
  console.log(event);
  if (event.type === "gameStart") { //console.log("Playing new game: " + event.game.id);
    setPlaying(true);
    play_game = newGame(event.game.id,"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",true);

    board_queue.push(snapshot(play_game)); startWatching(play_game.gid);

    //fetch("https://lichess.org/api/board/game/stream/" + play_game.gid, {
    //  method: 'get',
    //  headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
    //}).then(readStream(processEvent));
  }
  //else if (event.type === "gameFinish") { setPlaying(false); initAllGames(); }
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
    headers: {'Content-Type':'application/json','Authorization': `Bearer ` + oauth},
    body: JSON.stringify({rated: false, time: 2, increment: 10, variant: "standard"})
  }).then(response => {
    let seek_reader = response.body.getReader();
    seek_reader.read().then(function processSeek({ done, value }) {
      if (!done) seek_reader.read().then(processSeek);
    });
  }).catch(function () { console.log("seek aborted"); }).finally( function() { endCurrentSeek(); } );
}

function endCurrentSeek() {
  document.getElementById("modal-seeking-overlay").style.display = 'none';
  seek_controller.abort();
}

function makeMove(move) {
  fetch("https://lichess.org/api/board/game/" + play_game.gid + "/move/" + move, {
    method: 'post',
    headers: {'Authorization': `Bearer ` + oauth}
  }).then(res => res.text().then(text => console.log(text)));
}

function dumpGames() {
  for (let i=0;i<game_list.length;i++) if (game_list[i] !== undefined) console.log(i + ": " + game_list[i].gid);
}

