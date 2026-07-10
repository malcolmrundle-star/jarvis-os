const timeElement = document.getElementById("time");
const core = document.getElementById("core");
const stateLabel = document.querySelector(".state");
const instruction = document.querySelector(".instruction");
const taskPanel = document.getElementById("task-panel");
const taskText = document.getElementById("task-text");

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

  const instructions = {
    ONLINE: "TAP CORE TO ACTIVATE",
    LISTENING: "ENTERING TASK",
    THINKING: "PROCESSING TASK",
    RESPONDING: "TASK RECEIVED"
  };

  instruction.textContent = instructions[state];

  clearTimeout(resetTimer);
}

function showTask(task) {
  taskText.textContent = task.toUpperCase();
  taskPanel.hidden = false;
}

async function runTaskSequence() {
  setState("LISTENING");

  const task = window.prompt("What task shall I record?", "TEST");

  if (!task || !task.trim()) {
    setState("ONLINE");
    return;
  }

  setState("THINKING");

  await new Promise(resolve => setTimeout(resolve, 1200));

  showTask(task.trim());
  setState("RESPONDING");

  if ("vibrate" in navigator) {
    navigator.vibrate([25, 50, 25]);
  }

  resetTimer = setTimeout(() => {
    setState("ONLINE");
  }, 2200);
}

core.addEventListener("click", runTaskSequence);

updateClock();
setInterval(updateClock, 1000);
setState("ONLINE");