//const FEN_SUFFIX = " - - 1 1";
const PIECE_CHRS = "kqrbnp-PNBRQK";
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let user_name = "anon";
let board_list = [];
let msg_queue = [];
let play_board = null;
let lich_sock = null;
let msg_loop = null;
let oauth = null;
let seek_controller = null;
let seek_signal = null;
let logged_in = false;
let watching = false;
let playing = false;
let current_tc = "rapid";
let log_button = document.getElementById("lab_login");
let play_button = document.getElementById("playButt");
let draw_button = document.getElementById("drawButt");
let resign_button = document.getElementById("resignButt");
let resurrect = true;
ResultEnum = {
  ONGOING: "Ongoing",
  BLACK : "0-1",
  WHITE : "1-0",
  DRAW : "1/2-1/2",
  ABORT: "Aborted"
}

function setOauth() {
  oauth = window.location.search.substr(1);
  if (oauth.length > 0) {
    let token = oauth.substring(oauth.indexOf("=")+1);
    setCookie("oauth",token,180); //console.log("New oauth: " + token);
    oauth = token;
    window.history.replaceState({}, document.title,window.location.href.split('?')[0]);
  }
  else  oauth = getCookie("oauth");
  if (oauth.length > 0) getUserInfo().then(json => {
    user_name = json.username; getEvents();
    log_button.innerText = "Logged in as: " + json.username;
    play_button.hidden = false;
  });
  else console.log("Bad oauth, augh");
}

function getUserInfo() {
  logged_in = true;
  return fetch("https://lichess.org/api/account",{
    method: "get",
    headers:{ 'Accept':'application/json', 'Authorization': `Bearer ` + oauth }
  }).then(result => result.json());
}

function setBoards(type,num) {
  if (type === undefined) type = "blitz";
  if (num === undefined) num = range_games.valueAsNumber;
  console.log("Fetching " + num + " TV Games...");
  let changed = true;
  if (board_list.length < num) {
    for (let i = board_list.length; i < num; i++) {
      board_list[i] = newBoard({id: "KludgeGame" + i}, false, false, null); //TODO: something less kludgy
      board_list[i].fin = true;
    }
  }
  else if (board_list.length > num) {
    for (let i=num;i<board_list.length;i++) clearBoard(board_list[i]);
    board_list = board_list.slice(0,num);
  }
  else changed = false;
  if (changed) drawBoards();
  fetch("http://lichess.org/api/tv/" + type + "?nb=" + num,{
    method: "get",
    headers:{'Accept':'application/x-ndjson'}
  }).then(readStream(processNewTV)); //.then(msg => console.log("TV games fetched: " + msg));
}

function processNewTV(game) { //console.log("New TV Game : " + JSON.stringify(game));
  if (game.id !== null && getObservedGame(game.id) === null) {
    for (let i = 0; i < board_list.length; i++) {
      if (board_list[i].fin) {
        let prev_x = board_list[i].canvas_loc.x, prev_y = board_list[i].canvas_loc.y;
        board_list[i] = newBoard(game,false,game.players.black.rating > game.players.white.rating);
        console.log("Adding " + getPlayString(board_list[i]) + " at index: " + i);
        board_list[i].canvas_loc.x = prev_x; board_list[i].canvas_loc.y = prev_y;
        board_queue.push(snapshot(board_list[i]));
        startWatching(game.id);
        break;
      }
    }
  }
  watching = true;
}

function clearBoard(board) {
  clearInterval(board.timer); board.fin = true;
}

function newBoard(data,playing,black_pov,timer) {
  let fen = START_FEN;
  if (data.moves !== undefined) {
    const game = new Chess(), moves = data.moves.split(" ");
    for (let i=0;i<moves.length;i++) game.move(moves[i]);
    fen = game.fen();
  }
  let board = {
    playing : playing, black_pov : black_pov, fin : false,
    matrix : initMatrix(fen,black_pov), canvas_loc : { x : 0, y : 0 },
    turn: fen.split(" ")[1], last_move : "", clock : { white: 0, black: 0 },
    result : ResultEnum.ONGOING, info : data
  };
  board.timer = timer === undefined ? setInterval(nextGameTick,1000,board): timer;
  return board;
}

function nextGameTick(board) { //console.log("Timer: " + board.timer);
  if (playing === board.playing) {
    if (board.turn === "b") board.clock.black--;
    else if (board.turn === "w") board.clock.white--;
    drawStatus(board,getBoardDim(board));
  }
}

function snapshot(board) { //return board;
  return JSON.parse(JSON.stringify(board));
}

function startWatching(gid) {
  send(lich_sock, JSON.stringify({ t: 'startWatching', d: gid }));
}

function initMatrix(fen,black_pov) {
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
      let piece = PIECE_CHRS.indexOf(char);
      if (piece === -1) file += parseInt(char); else {
        if (black_pov) matrix[7-rank][7-file++].piece = piece - 6;
        else matrix[rank][file++].piece = piece - 6;
      }
    }
  }
  return matrix;
}

function getObservedGame(gid) {
  for (let i=0; i<board_list.length; i++) if (board_list[i].info.id === gid && !board_list[i].fin) return board_list[i];
  return null;
}

function send(sock, message) {
  if (sock.readyState === 1) sock.send(message); else msg_queue.push(message);
}

function setResult(data,board) { //console.log("Winner: " + JSON.stringify(data));
  let info = getBoardInfo(board);
  switch (data.d.win) {
    case "b": board.result = ResultEnum.BLACK; break;
    case "w": board.result = ResultEnum.WHITE; break;
    case "null": board.result = ResultEnum.DRAW; break;
    default:  board.result = ResultEnum.ABORT;
  }
  clearInterval(board.timer);
  board_queue.push(board);
}

function runLichessSocket() { //document.getElementById("sockButt").innerText = "Stop";
  lich_sock = new WebSocket('wss://socket.lichess.org/api/socket',[]);

  lich_sock.onopen = function () {
    console.log("Connected to Lichess..."); //send(lich_sock,JSON.stringify({t: 'poolIn', d: '1'}));
    msg_queue = [];
    msg_loop = setInterval(function() {
      if (lich_sock.readyState === 1 && msg_queue.length > 0) lich_sock.send(msg_queue.pop());
      else lich_sock.send(" t : 0, p : 0 }");
    },2000);
    setBoards();
  }

  lich_sock.onerror = e => console.error("Oops: " + e);

  lich_sock.onmessage = e => newObservation(e);

  lich_sock.onclose = function () {
    console.log("Socket closed");
    //clearInterval(msg_loop); lich_sock = null; for (let i=0; i<board_list.length; i++) clearBoard(board_list[i]);
    if (resurrect) runLichessSocket();
  }

}

function newObservation(e) {
  let data = JSON.parse(e.data);
  if (data.t) { //console.log(data);
    if (data.d.id) { //console.log(data);
      let board = playing ? play_board : getObservedGame(data.d.id);
      if (playing ? play_board.info.id === data.d.id : board !== null) {
        if (data.t === "fen" && board.result === ResultEnum.ONGOING) {
          board.matrix = initMatrix(data.d.fen,board.black_pov);
          board.last_move = data.d.lm;
          board.clock = { white : data.d.wc, black : data.d.bc };
          board.turn = data.d.fen.split(" ")[1];
          board_queue.push(snapshot(board));
        }
        else if (data.t === "finish") setResult(data,board);
      }
    }
  }
}

function getEvents() {
  console.log("Getting event stream for " + user_name + "...");
  fetch("https://lichess.org/api/stream/event",{
    method: 'get',
    headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
  }).then(readStream(processLobby)).then(msg => console.log("Events done: " + msg));
}

function processLobby(event) { //console.log("Lobby Event: " + JSON.stringify(event));
  if (event.type === "gameStart") { //console.log("Playing new game: " + event.game.id);
    fetch("https://lichess.org/api/board/game/stream/" + event.game.id, {
      method: 'get',
      headers:{'Accept':'application/x-ndjson','Authorization': `Bearer ` + oauth }
    }).then(readStream(processPlay));
  }
  //else if (event.type === "gameFinish") { setPlaying(false); initAllGames(); }
}

function processPlay(event) { //console.log("Play Event: " + JSON.stringify(event));
  if (event.type === "gameFull") {
    play_board = newBoard(event,true, event.black.name === user_name);
    setPlaying(true);
    startWatching(play_board.info.id);
  }
}

function setPlaying(bool) { //console.log("Playing: " + playing); clearScreen();
  playing = bool;
  if (playing) {
    let cmds = document.getElementsByClassName("play_cmds");
    for (let i=0;i<cmds.length;i++) cmds[i].style.display = "inline";
  }
  else {
    let cmds = document.getElementsByClassName("play_cmds");
    for (let i=0;i<cmds.length;i++) cmds[i].style.display = "none";
    clearBoard(play_board); setBoards();
  }
  drawBoards();
}

//(ornicar) readStream takes a function as argument, and returns a function that takes a response as argument and returns a Promise

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
  updateRatings(true);
}

function getTimeControl(initial,inc) {
  let n = initial + (40 * inc);
  if (n < 29) return "ultraBullet";
  else if (n < 179) return "bullet";
  else if (n < 479) return "blitz";
  else if (n < 1499) return "rapid";
  else return "classical";
}

function updateRatings(force) { //console.log("Update: ");
  let variant = document.getElementById("selectVariant").value;
  let tc = getTimeControl(time_range_butt_obj.value * 60,inc_range_butt_obj.value);
  if (!force && (variant !== "standard" || current_tc === tc)) return;
  console.log("Updating ratings...");
  current_tc = tc;
  getRating(variant,tc)
    .then(rating => {
    min_rating_range_butt_obj.setValue(rating-400);
    max_rating_range_butt_obj.setValue(rating+400);
    document.getElementById("seekType").innerText = "Rating: " + rating + ", Time Control: " + tc;
  });
}

function getRating(variant,time_control) {
  if (variant !== "standard") time_control = variant;
  return getUserInfo().then(info => info.perfs[time_control].rating);
}

function seek() {
  document.getElementById("modal-seek-overlay").style.display = 'none';
  document.getElementById("modal-seeking-overlay").style.display = 'block';
  let minutes = time_range_butt_obj.value;
  let inc = inc_range_butt_obj.value;
  let time_control = getTimeControl(minutes * 60,inc);
  if (time_control !== "rapid" && time_control !== "classical") endCurrentSeek("Bad time control: " + time_control);
  else {
    let variant = document.getElementById("selectVariant").value;
    let rated = document.getElementById("chkRated").checked;
    let min_rating = min_rating_range_butt_obj.value;
    let max_rating = max_rating_range_butt_obj.value;
    getRating(variant, time_control).then(rating => seekGame(variant, minutes, inc, rated, min_rating, max_rating));
  }
}

function seekGame(variant,minutes,inc,rated,min_rating,max_rating) {  //console.log("Rating: " + rating);
  let body_text = "variant=" + variant + "&rated=" + rated + "&time=" + minutes + "&increment=" + inc; // + "&ratingRange=" + min_rating + "-" + max_rating;
  console.log("Seeking: " + body_text);
  seek_controller = new AbortController();
  seek_signal = seek_controller.signal;

  fetch("https://lichess.org/api/board/seek",{
    method: 'post',
    signal: seek_signal,
    headers: {'Content-Type':'application/x-www-form-urlencoded','Authorization': `Bearer ` + oauth},
    body: body_text
  }).then(response => { //console.log("Status: " + response.status);
    if (response.status === 200) {
      let seek_reader = response.body.getReader();
      seek_reader.read().then(function processSeek({ done, value }) {
        if (!done) {
          console.log("Seek data: " + value);
          seek_reader.read().then(processSeek);
        }
        else endCurrentSeek();
      });
    }
    else {
      endCurrentSeek("Bad Seek!");
    }
  }).catch(oops => { console.log("seek aborted: " + oops.message); }); //.finally( function() { endCurrentSeek(); } );
}

function endCurrentSeek(msg) {
  document.getElementById("modal-seeking-overlay").style.display = 'none';
  if (seek_controller !== null) seek_controller.abort();
  if (msg !== undefined) window.setTimeout(() => alert(msg),1000);
}

function chessCmd(endpt) {
  if (!playing) { alert("Not playing!"); return; } //shouldn't occur
  fetch("https://lichess.org/api/board/game/" + play_board.info.id + endpt, {
    method: 'post',
    headers: {'Authorization': `Bearer ` + oauth}
  }).then(res => res.text().then(text => console.log(text)));
}

function makeMove(move) { chessCmd("/move/" + move); }
function offerDraw() { chessCmd("/draw/yes"); }
function resign() { chessCmd("/resign"); }

function getBoardInfo(board) { //TODO: fix this yucky kludge
  let black_player = {
    name : board.playing ? board.info.black.name : board.info.players.black.user.id,
    rating : board.playing ? board.info.black.rating : board.info.players.black.rating,
  }
  let white_player = {
    name : board.playing ? board.info.white.name : board.info.players.white.user.id,
    rating : board.playing ? board.info.white.rating : board.info.players.white.rating,
  }
  return {
    black: black_player,
    white: white_player,
    initial_time: board.playing ? board.info.clock.initial/1000 : board.info.clock.initial
  };
}

function getPlayString(board) {
  let info = getBoardInfo(board);
  return info.white.name + " - " + info.black.name;
}


