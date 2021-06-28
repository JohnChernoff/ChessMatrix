const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
let audioContext = new AudioContextFunc();
const player = new WebAudioFontPlayer();
const MOVE = "Move", CAPTURE = "Capture", CASTLING = "Castling", CHECK = "Check", CHECKMATE = "Checkmate";
const INSTRUMENTS = [MOVE,CAPTURE,CASTLING,CHECK,CHECKMATE];
const MIDI_DEFAULTS = [73,45,116,1,1];
const orchestra = [];
let muted = true;
let max_volume = .1;
let tempo = .5;
let note_queue = [];

function setTempo(t) {
  tempo = t/100;
  console.log("Tempo: " + tempo);
}

function setMute(mute) {
  muted = mute;
  console.log("Muted: " + muted);
}

function initAudio(timbre_menu_id) {
  for (let i = 0; i<INSTRUMENTS.length; i++) {
    createMIDISelection(i,MIDI_DEFAULTS[i],timbre_menu_id);
    loadInstrument(INSTRUMENTS[i]);
  }
}

function createMIDISelection(instrument,timbre,element_id) {
  let type = INSTRUMENTS[instrument];
  let sel = document.createElement("select");
  sel.id = "select_" + type;
  let previousInst = "";
  for (let i = 0; i < player.loader.instrumentKeys().length; i++) {
    let opt = document.createElement('option');
    let title = player.loader.instrumentInfo(i).title;
    if (previousInst !== title) { //there often exist several duplicate instruments within each bank
      previousInst = title;
      opt.innerHTML = title;
      opt.value = i.toString();
      sel.appendChild(opt);
    }
  }
  sel.selectedIndex = timbre;
  sel.addEventListener("click", ()=> loadInstrument(type));
  let label = document.createElement("label");
  label.htmlFor = sel.id;
  label.textContent = "Timbre: " + INSTRUMENTS[instrument];
  let div = document.getElementById(element_id);
  div.appendChild(label);
  div.appendChild(document.createElement("br"));
  div.appendChild(sel);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createElement("br"));
}

function loadInstrument(type) {
  let i = document.getElementById("select_" + type).value;
  let info = player.loader.instrumentInfo(i);
  player.loader.startLoad(audioContext, info.url, info.variable);
  player.loader.waitLoad(function () { orchestra[type] = window[info.variable]; });
}

function playNote(i,t,p,d,v) { //console.log(i + "," + t + "," + p + "," + d + "," + v +"," + mute);
  if (!muted) return player.queueWaveTable(audioContext, audioContext.destination, i,t,p,d,v);
  else return null;
}

function addNoteToQueue(i,p,d,v) {
  note_queue.push({
    instrument: i, pitch: p, duration: d * 1000, volume: v
  });
}

function melodizer() {
  if (note_queue.length > 0) {
    let note = note_queue.pop();
    let duration = tempo * note.duration;
    //console.log("Duration")
    playNote(note.instrument,0,note.pitch,duration/1000,note.volume);
    setTimeout(() => melodizer(),duration);
  }
  else setTimeout(() => melodizer(),50);
}
