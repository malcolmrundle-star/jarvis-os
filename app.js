const timeElement = document.getElementById("time");
const core = document.getElementById("core");
const stateLabel = document.querySelector(".state");
const instruction = document.querySelector(".instruction");
const taskPanel = document.getElementById("task-panel");
const taskText = document.getElementById("task-text");

function updateClock() {
  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setState(nextState) {
  stateLabel.textContent = nextState;
  core.dataset.state = nextState.toLowerCase();

  const messages = {
    ONLINE: "TAP CORE TO ACTIVATE",
    LISTENING: "ENTER YOUR TASK",
    THINKING: "PROCESSING TASK",
    RESPONDING: "TASK RECEIVED"
  };

  instruction.textContent = messages[nextState];
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function activateJarvis() {
  setState("LISTENING");

  await delay(400);

  const enteredTask = prompt("What task shall I record?", "TEST");

  if (!enteredTask || !enteredTask.trim()) {
    setState("ONLINE");
    return;
  }

  setState("THINKING");

  await delay(1200);

  taskText.textContent = enteredTask.trim().toUpperCase();
  taskPanel.hidden = false;

  setState("RESPONDING");

  if ("vibrate" in navigator) {
    navigator.vibrate([25, 40, 25]);
  }

  await delay(2000);

  setState("ONLINE");
}

core.addEventListener("click", activateJarvis);

updateClock();
setInterval(updateClock, 1000);
setState("ONLINE");