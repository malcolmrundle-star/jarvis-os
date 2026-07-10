document.addEventListener("DOMContentLoaded", () => {
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

    if (timeElement) {
      timeElement.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }

  function setState(nextState) {
    if (stateLabel) {
      stateLabel.textContent = nextState;
    }

    if (core) {
      core.dataset.state = nextState.toLowerCase();
    }

    const messages = {
      ONLINE: "TAP CORE TO ACTIVATE",
      LISTENING: "AWAITING COMMAND",
      THINKING: "PROCESSING COMMAND",
      RESPONDING: "COMMAND ACCEPTED",
      COMPLETE: "TASK COMPLETE"
    };

    if (instruction) {
      instruction.textContent = messages[nextState];
    }
  }

  function delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  function openCommandPanel() {
    if (busy || !commandPanel || !commandInput) {
      return;
    }

    setState("LISTENING");
    commandPanel.hidden = false;

    if (taskResult) {
      taskResult.hidden = true;
    }

    setTimeout(() => {
      commandInput.focus();
    }, 150);
  }

  async function processCommand(command) {
    busy = true;

    if (commandInput) {
      commandInput.blur();
    }

    setState("THINKING");
    await delay(1200);

    if (taskText) {
      taskText.textContent = command.toUpperCase();
    }

    if (taskResult) {
      taskResult.hidden = false;
    }

    setState("RESPONDING");
    await delay(1300);

    setState("COMPLETE");

    if ("vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    await delay(2200);

    if (commandPanel) {
      commandPanel.hidden = true;
    }

    if (taskResult) {
      taskResult.hidden = true;
    }

    if (commandInput) {
      commandInput.value = "";
    }

    setState("ONLINE");
    busy = false;
  }

  if (core) {
    core.addEventListener("click", openCommandPanel);
  }

  if (commandForm && commandInput) {
    commandForm.addEventListener("submit", event => {
      event.preventDefault();

      if (busy) {
        return;
      }

      const command = commandInput.value.trim();

      if (!command) {
        commandInput.focus();
        return;
      }

      processCommand(command);
    });
  }

  updateClock();
  setInterval(updateClock, 1000);
  setState("ONLINE");
});