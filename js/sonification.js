const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
let audioContext = new AudioContextFunc();
const player = new WebAudioFontPlayer();
const INST_MELODY = "Move Melody", INST_HARMONY = "Move Harmony", INST_CAPTURE = "Capture", INST_CASTLING = "Castling", INST_CHECK = "Check";
const INSTRUMENTS = [INST_MELODY,INST_HARMONY,INST_CAPTURE,INST_CASTLING,INST_CHECK];
const MIDI_DEFAULTS = [1,73,45,116,1];
const orchestra = [];
let muted = true;
let max_volume = .75;
let tempo = .4;
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
  let label_inst = document.createElement("label");
  label_inst.htmlFor = sel.id;
  label_inst.textContent = "Timbre: " + type; //INSTRUMENTS[instrument];
  let div = document.getElementById(element_id);
  div.appendChild(label_inst);
  div.appendChild(document.createElement("br"));
  div.appendChild(sel);
  div.appendChild(document.createElement("br"));
  let range_vol = document.createElement("input");
  range_vol.id = "range_" + type;
  range_vol.type = 'range';
  range_vol.min = '0';
  range_vol.max = '100';
  range_vol.value = '50';
  range_vol.step = '1';
  let label_vol = document.createElement("label");
  label_vol.htmlFor = "";
  label_vol.textContent = "Volume: ";
  div.appendChild(label_vol);
  div.appendChild(range_vol);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createElement("br"));
}

function loadInstrument(type) {
  let i = document.getElementById("select_" + type).value;
  let info = player.loader.instrumentInfo(i);
  player.loader.startLoad(audioContext, info.url, info.variable);
  player.loader.waitLoad(function () { orchestra[type] = window[info.variable]; });
}

function playNote(i,t,p,d,v) {
  if (!muted) {
    return player.queueWaveTable(audioContext, audioContext.destination, i,t,p,tempo * d,
      v > max_volume ? max_volume : v);
  }
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
    playNote(note.instrument,0,note.pitch,note.duration/1000,note.volume);
    setTimeout(() => melodizer(),tempo * note.duration);
  }
  else setTimeout(() => melodizer(),50);
}
