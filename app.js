const timeElement = document.getElementById("time");
const core = document.getElementById("core");
const stateLabel = document.querySelector(".state");
const instruction = document.querySelector(".instruction");

const commandPanel = document.getElementById("command-panel");
const commandForm = document.getElementById("command-form");
const commandInput = document.getElementById("command-input");

const taskResult = document.getElementById("task-result");
const taskText = document.getElementById("task-text");

let busy = false;

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
    LISTENING: "AWAITING COMMAND",
    THINKING: "PROCESSING COMMAND",
    RESPONDING: "COMMAND ACCEPTED",
    COMPLETE: "TASK COMPLETE"
  };

  instruction.textContent = messages[nextState];
}

function delay(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

function openCommandPanel() {
  if (busy) return;

  setState("LISTENING");

  commandPanel.hidden = false;
  taskResult.hidden = true;

  setTimeout(() => {
    commandInput.focus();
  }, 150);
}

async function processCommand(command) {
  busy = true;

  commandInput.blur();

  setState("THINKING");
  await delay(1200);

  taskText.textContent = command.toUpperCase();
  taskResult.hidden = false;

  setState("RESPONDING");
  await delay(1400);

  setState("COMPLETE");

  if ("vibrate" in navigator) {
    navigator.vibrate([30, 60, 30]);
  }

  await delay(1800);

  commandPanel.hidden = true;
  commandInput.value = "";
  taskResult.hidden = true;

  setState("ONLINE");
  busy = false;
}

core.addEventListener("click", openCommandPanel);

commandForm.addEventListener("submit", event => {
  event.preventDefault();

  if (busy) return;

  const command = commandInput.value.trim();

  if (!command) {
    commandInput.focus();
    return;
  }

  processCommand(command);
});

updateClock();
setInterval(updateClock, 1000);
setState("ONLINE");