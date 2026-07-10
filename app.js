const timeElement = document.getElementById("time");
const core = document.getElementById("core");
const stateLabel = document.querySelector(".state");
const instruction = document.querySelector(".instruction");

const states = [
  "ONLINE",
  "LISTENING",
  "THINKING",
  "RESPONDING"
];

let currentState = 0;
let resetTimer;

function updateClock() {
  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setState(state) {

  stateLabel.textContent = state;

  core.dataset.state = state.toLowerCase();

  switch (state) {

    case "ONLINE":
      instruction.textContent = "TAP CORE TO ACTIVATE";
      break;

    case "LISTENING":
      instruction.textContent = "LISTENING...";
      break;

    case "THINKING":
      instruction.textContent = "PROCESSING";
      break;

    case "RESPONDING":
      instruction.textContent = "RESPONDING";
      break;

  }

  clearTimeout(resetTimer);

  if (state !== "ONLINE") {

    resetTimer = setTimeout(() => {

      currentState = 0;

      setState("ONLINE");

    },3000);

  }

}

core.addEventListener("click",()=>{

  currentState++;

  if(currentState>=states.length){

    currentState=1;

  }

  setState(states[currentState]);

  if(navigator.vibrate){

    navigator.vibrate(20);

  }

});

updateClock();

setInterval(updateClock,1000);

setState("ONLINE");