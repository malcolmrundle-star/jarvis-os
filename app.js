const time = document.getElementById("time");
const core = document.getElementById("core");
const state = document.querySelector(".state");

const modes = [
  "ONLINE",
  "LISTENING",
  "THINKING",
  "RESPONDING"
];

let index = 0;
let timeout;

function updateClock() {
  const now = new Date();

  time.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }).toLowerCase();
}

function setMode(mode) {

  state.textContent = mode;

  core.dataset.state = mode.toLowerCase();

  clearTimeout(timeout);

  if (mode !== "ONLINE") {

    timeout = setTimeout(() => {

      index = 0;

      state.textContent = "ONLINE";

      core.dataset.state = "online";

    },3000);

  }

}

core.addEventListener("click",()=>{

  index++;

  if(index>=modes.length){

    index=1;

  }

  setMode(modes[index]);

  if(navigator.vibrate){

    navigator.vibrate(20);

  }

});

updateClock();

setInterval(updateClock,1000);

setMode("ONLINE");