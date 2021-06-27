/* TODO:
    weird bugs/animation catchups from tabbing away or lichess socket closing
    drag-move
    visually indicate logged in status/username, disable playing when not logged in
    visually indicate turn
    flip board, accept draw, chat
    move histories
    musical events (board = instrument, square = pitch)
    fancier animations
    help of some sort
*/

let board_range_butt_obj, time_range_butt_obj, inc_range_butt_obj, max_rating_range_butt_obj, min_rating_range_butt_obj,
hodge_var1_butt_obj,hodge_var2_butt_obj,hodge_var3_butt_obj;

//console.log(getCookie("oauth"));
function main() {

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
  if (oauth.length > 0) document.getElementById("logButt").innerText ="Lichess relog";
  resize();
  runLichessSocket();
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

