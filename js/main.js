/* TODO:
    matrix should be be internall consistent
    weird bugs/animation/audio catchups from tabbing away or lichess socket closing
    drag-move
    flip board, accept draw, chat
    move histories
    help of some sort
*/

let time_range_butt_obj, inc_range_butt_obj, max_rating_range_butt_obj, min_rating_range_butt_obj,
hodge_var1_butt_obj,hodge_var2_butt_obj,hodge_var3_butt_obj;
const INST_MELODY = "Move Melody", INST_RHYTHM = "Move Rhythm (Real Time)", INST_CAPTURE = "Capture (Harmony)", INST_CASTLING = "Castling", INST_CHECK = "Check";
const INSTRUMENTS = [INST_MELODY,INST_RHYTHM,INST_CAPTURE,INST_CASTLING,INST_CHECK];
const ENSEMBLES = [
  { patches: [73,113,0,45,116],levels: [48,24,24,50,50] },
  { patches: [70,45,8,45,116], levels: [48,12,16,50,50] },
  { patches: [27,115,15,45,116], levels: [48,16,12,50,50] },
  { patches: [41,108,28,45,116], levels: [36,24,16,50,50] },
  { patches: [0,0,0,45,116],   levels: [36,24,24,50,50] },
];
const OCTAVE = 12;
const MAX_PITCH = OCTAVE * 7, MIN_PITCH = OCTAVE * 2;
const TEMPO_CONTROL = document.getElementById("range_tempo");

//console.log(getCookie("oauth"));
function main() {

  initAudio("modal-midi-wrap",INSTRUMENTS,ENSEMBLES[0]);
  setMute(document.getElementById("chkMute").checked);
  setTempo(document.getElementById("range_tempo").valueAsNumber);
  melodizer();

  time_range_butt_obj = new RangeButton(document.getElementById("timeRangeButt"),0,60,5,1,250,updateRatings);
  registerButton(time_range_butt_obj);

  inc_range_butt_obj = new RangeButton(document.getElementById("incRangeButt"),0,24,5,1,250,updateRatings);
  registerButton(inc_range_butt_obj);

  max_rating_range_butt_obj = new RangeButton(document.getElementById("maxRatingRangeButt"),1000,3000,1500,50,250);
  registerButton(max_rating_range_butt_obj);

  min_rating_range_butt_obj = new RangeButton(document.getElementById("minRatingRangeButt"),1000,3000,1500,50,250);
  registerButton(min_rating_range_butt_obj);

  hodge_var1_butt_obj = new RangeButton(document.getElementById("hodgeVar1Butt"),1,32,7,1,250);
  registerButton(hodge_var1_butt_obj);

  hodge_var2_butt_obj = new RangeButton(document.getElementById("hodgeVar2Butt"),1,32,7,1,250);
  registerButton(hodge_var2_butt_obj);

  hodge_var3_butt_obj = new RangeButton(document.getElementById("hodgeVar3Butt"),1,64,7,1,250);
  registerButton(hodge_var3_butt_obj);

  setOauth();
  resize();
  runLichessSocket();
}

function setRandomEnsemble() {
  let ensemble = ENSEMBLES[Math.floor(Math.random() * ENSEMBLES.length)]; //console.log("Randomizing..." + JSON.stringify(ensemble));
  for (let i=0;i<ensemble.patches.length;i++) setInstrument(INSTRUMENTS[i],ensemble.patches[i],ensemble.levels[i]);
  let t = 5 + Math.random() * 36; TEMPO_CONTROL.value = t; setTempo(t);
}

function setCookie(cname, cvalue, exdays) {
  let d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let user = getCookie("username");
  if (user !== "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user !== "" && user != null) {
      setCookie("username", user, 365);
    }
  }
}

function sec2hms(timect,init) {
  if (timect === undefined || timect <=0 || timect === null) timect = init;
  let se=timect % 60; //the remainder after div by 60
  timect = Math.floor(timect/60);
  let mi=timect % 60; //the remainder after div by 60
  timect = Math.floor(timect/60);
  let hr = timect % 24; //the remainder after div by 24
  let dy = Math.floor(timect/24);
  return padify (se, mi, hr, dy);
}

function padify(se, mi, hr, dy) {
  hr = hr<10?"0"+hr:hr;
  mi = mi<10?"0"+mi:mi;
  se = se<10?"0"+se:se;
  dy = dy>0?dy+"d ":"";
  return dy+hr+":"+mi+":"+se;
}

function playMove(move,black_pov) {
  if (move !== null) {
    let fromPitch = MIN_PITCH + (move.from.y * 8) + move.from.x;
    let toPitch = MIN_PITCH + (move.to.y * 8) + move.to.x;
    let chord = [24 + move.from.x,36 + move.from.y,48 + move.to.x,60 + move.to.y];
    let volume = .25;
    let dist =  calcMoveDist(move);
    if (move.type === INST_CAPTURE || move.type === INST_CASTLING) {
      //playNote(orchestra[move.type],0,fromPitch,1,volume);
      //playNote(orchestra[move.type],0,toPitch,1,volume);
      addChordToQueue(move.type,chord,8,volume);
      let extreme = 0;
      for (let p=0;p<Math.abs(move.piece);p++) {
        for(let i=0;i<dist;i++) {
          if (melody.patterns.length > i) {
            let pattern = melody.patterns[melody.patterns.length - 1 - i];
            let pitch = (Math.random() < .75) ? octaveCheck(melody.pitch,pattern.interval) : melody.pitch + pattern.interval;
            if (pitch <= MAX_PITCH && pitch >= MIN_PITCH) melody.pitch = pitch; else extreme++;
            if ((Math.random() * 8) < extreme) { melody.pitch = 48; extreme = 0; }
            //console.log("Pattern: " + JSON.stringify(pattern) + " -> " + melody.pitch + "," + pattern.rhythm + ", size: " + melody.patterns.length);
            addNoteToQueue(INST_MELODY,melody.pitch,pattern.rhythm,volume);
          }
          else break;
        }
      }
    }
    else {
      let dur = .5 + (Math.abs(move.piece)/2);
      let interval = Math.round(((dist-1)/6) * OCTAVE) + (move.from.x - move.from.y);
      let last_interval = melody.patterns.length > 0 ? melody.patterns[melody.patterns.length-1].interval : 0;
      let dir = move.from.y - move.to.y; let up = move.piece < 0 ? dir < 0 :  dir > 0; if (black_pov) up = !up; //sideways = down
      let reversal = (Math.random() * last_interval) > 2; //let undertow = (Math.random() * 144) < (melody.pitch - 24);
      if (!up || reversal) interval = -interval;
      melody.pitch += interval;
      if (melody.pitch > MAX_PITCH) melody.pitch = MAX_PITCH;
      else if (melody.pitch < MIN_PITCH) melody.pitch = MIN_PITCH;
      else {
        melody.patterns.push({ rhythm: dur, interval: interval});
        if (melody.patterns.length > 24) melody.patterns.shift();
      }
      console.log(melody);
      //addNoteToQueue(orchestra[INST_MELODY],melody.pitch,dur,volume); //console.log(Math.abs(move.piece) + " -> " + d);
      playNote(INST_RHYTHM,0,toPitch,8,volume);
    }
  }
}

function octaveCheck(pitch,interval) {
  let octave = Math.floor(pitch/OCTAVE);
  let new_octave = Math.floor((pitch + interval) / OCTAVE);
  let correction = ((octave-new_octave) * OCTAVE); //console.log(pitch + "," + interval + ", " + "Correction: " + correction);
  return correction + (pitch + interval);
}
