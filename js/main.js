/* TODO:
    weird bugs/animation/audio catchups from tabbing away or lichess socket closing
    drag-move
    flip board, accept draw, chat
    move histories
    help of some sort
*/

let time_range_butt_obj, inc_range_butt_obj, max_rating_range_butt_obj, min_rating_range_butt_obj,
hodge_var1_butt_obj,hodge_var2_butt_obj,hodge_var3_butt_obj;
const INST_MELODY = "Move Melody", INST_HARMONY = "Move Harmony", INST_CAPTURE = "Capture", INST_CASTLING = "Castling", INST_CHECK = "Check";
const INSTRUMENTS = [INST_MELODY,INST_HARMONY,INST_CAPTURE,INST_CASTLING,INST_CHECK];
const ENSEMBLES = [
  { patches: [73,45,46,45,116],levels: [48,24,24,50,50] },
  { patches: [70,48,0,45,116], levels: [48,12,16,50,50] },
  { patches: [73,0,48,45,116], levels: [48,16,12,50,50] },
  { patches: [41,73,0,45,116], levels: [36,24,16,50,50] },
  { patches: [0,0,0,45,116],   levels: [36,24,24,50,50] },
];

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

