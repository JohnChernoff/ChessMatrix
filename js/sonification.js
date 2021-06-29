const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
let audioContext = new AudioContextFunc();
const audio_player = new WebAudioFontPlayer();
const orchestra = [];
let players;
let muted = true;
let max_volume = .75;
let tempo = .4;
let note_queue = [];

function setTempo(t) {
  tempo = t/100; console.log("Tempo: " + tempo);
}

function setMute(mute) {
  muted = mute; console.log("Muted: " + muted);
}

function getInstrumentControl(i) { return document.getElementById("select_" + i); }
function getVolumeControl(i) { return document.getElementById("range_vol_" + i); }

function initAudio(audio_menu_id,instruments,defaults) {
  players = instruments;
  for (let i = 0; i<players.length; i++) {
    createMIDISelection(players[i],audio_menu_id);
    setInstrument(players[i],defaults.patches[i],defaults.levels[i]);
  }
}

function createMIDISelection(type,element_id) { //let type = players[instrument];
  let sel = document.createElement("select");
  sel.id = "select_" + type;
  let previousInst = "";
  for (let i = 0; i < audio_player.loader.instrumentKeys().length; i++) {
    let opt = document.createElement('option');
    let title = audio_player.loader.instrumentInfo(i).title;
    if (previousInst !== title) { //there often exist several duplicate instruments within each bank
      previousInst = title;
      opt.innerHTML = title;
      opt.value = i.toString();
      sel.appendChild(opt);
    }
  }
  //sel.selectedIndex = timbre;
  sel.addEventListener("click", ()=> setInstrument(type));
  let label_inst = document.createElement("label");
  label_inst.htmlFor = sel.id;
  label_inst.textContent = "Timbre: " + type;
  let div = document.getElementById(element_id);
  div.appendChild(label_inst);
  div.appendChild(document.createElement("br"));
  div.appendChild(sel);
  div.appendChild(document.createElement("br"));
  let range_vol = document.createElement("input");
  range_vol.id = "range_vol_" + type;
  range_vol.type = 'range';
  range_vol.min = '0';
  range_vol.max = '100';
  range_vol.value = '50';
  range_vol.step = '1';
  let label_vol = document.createElement("label");
  label_vol.htmlFor = range_vol.id;
  label_vol.textContent = "Volume: ";
  div.appendChild(label_vol);
  div.appendChild(range_vol);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createElement("br"));
}

function setInstrument(type,patch,level) { //console.log("Setting: " + type + "," + patch + "," + level);
  let instrument = getInstrumentControl(type); if (patch !== undefined) instrument.selectedIndex = patch;
  let vol_control = getVolumeControl(type); if (level !== undefined) vol_control.value = level;
  let info = audio_player.loader.instrumentInfo(instrument.value);
  audio_player.loader.startLoad(audioContext, info.url, info.variable);
  audio_player.loader.waitLoad(function () { orchestra[type] = window[info.variable]; });
}

function playNote(i,t,p,d,v) {
  let volume = v * (getVolumeControl(i).valueAsNumber/100);
  if (!muted && volume > 0) {
    return audio_player.queueWaveTable(audioContext, audioContext.destination, orchestra[i],t,p,tempo * d,
      volume > max_volume ? max_volume : volume);
  }
  else return null;
}

function addNoteToQueue(i,p,d,v) {
  note_queue.push({ instrument: i, pitch: p, duration: d * 1000, volume: v });
}

function melodizer() {
  if (note_queue.length > 0) {
    let note = note_queue.pop(); //console.log("waiting: " + (tempo * note.duration));
    playNote(note.instrument,0,note.pitch,note.duration/1000,note.volume);
    setTimeout(() => melodizer(),tempo * note.duration);
  }
  else setTimeout(() => melodizer(),50);
}
