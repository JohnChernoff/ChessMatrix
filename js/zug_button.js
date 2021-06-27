function registerButton(button) {
  button.element.onmousedown = event => mouseDown(event,button);
  button.element.onmouseup = event => mouseUp(event,button);
  button.element.oncontextmenu = event => contextMenu(event);
}

function mouseDown(event,button) {
  button.changing = true;
  if (button !== null) animateChange(button,event.button === 0 ? button.increment : -button.increment);
}

function mouseUp(event,button) { //console.log("Mouse up: " + butt);
  if (button !==  null) button.changing = false;
  if (button.click_fun !== undefined) button.click_fun();
}

function contextMenu(event) {
  event.preventDefault(); //return false;
}

function animateChange(button,v) { //console.log("Animating Button: " + button);
  if (button.changing) {
    button.advance(v);
    setTimeout(() => {
      requestAnimationFrame(
        function () { animateChange(button,v); });
    }, button.speed);
  }
}

function RangeButton(e,min,max,def,i,spd,f) {
  this.element = e;
  this.min_value = min;
  this.max_value = max;
  this.value = def;
  this.changing = false;
  this.increment = i;
  e.innerHTML = def;
  this.speed = spd;
  this.click_fun = f;

  this.advance = v => {
    this.value += v;
    if (this.value < this.min_value) this.value = this.max_value;
    else if (this.value > this.max_value) this.value = this.min_value;
    this.element.innerHTML = this.value;
  }

  this.setValue = v => {
    this.value = v;
    this.element.innerHTML = v;
  }

}

