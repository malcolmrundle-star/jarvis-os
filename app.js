const timeElement = document.getElementById("time");
const core = document.getElementById("core");
const stateLabel = document.querySelector(".state");

const states = [
  "ONLINE",
  "LISTENING",
  "THINKING",
  "RESPONDING"
];

let stateIndex = 0;
let resetTimer;

function updateTime() {
  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setState(state) {
  stateLabel.textContent = state;
  core.dataset.state = state.toLowerCase();

  clearTimeout(resetTimer);

  if (state !== "ONLINE") {
    resetTimer = setTimeout(() => {
      stateIndex = 0;
      setState("ONLINE");
    }, 3000);
  }
}

core.addEventListener("click", () => {
  stateIndex = (stateIndex + 1) % states.length;
  setState(states[stateIndex]);

  if ("vibrate" in navigator) {
    navigator.vibrate(25);
  }
});

updateTime();
setInterval(updateTime, 1000);

setState("ONLINE");