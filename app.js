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

  const decisionStatus = document.getElementById("decision-status");
  const nextTaskElement = document.getElementById("next-task");
  const decisionReason = document.getElementById("decision-reason");

  let busy = false;

  const tasks = [
    {
      title: "Connect JARVIS Decision Engine",
      priority: 5,
      urgency: 5,
      projectValue: 5,
      effort: 2,
      completed: false
    },
    {
      title: "Add persistent task memory",
      priority: 5,
      urgency: 3,
      projectValue: 5,
      effort: 3,
      completed: false
    },
    {
      title: "Connect voice input",
      priority: 4,
      urgency: 3,
      projectValue: 5,
      effort: 4,
      completed: false
    }
  ];

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
      THINKING: "EVALUATING PRIORITIES",
      RESPONDING: "DECISION READY",
      COMPLETE: "TASK SELECTED"
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

  function calculateTaskScore(task) {
    return (
      task.priority * 4 +
      task.urgency * 3 +
      task.projectValue * 3 -
      task.effort
    );
  }

  function chooseNextTask() {
    const availableTasks = tasks.filter(task => !task.completed);

    if (availableTasks.length === 0) {
      return null;
    }

    return availableTasks
      .map(task => ({
        ...task,
        score: calculateTaskScore(task)
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  function explainDecision(task) {
    const reasons = [];

    if (task.priority >= 5) {
      reasons.push("highest priority");
    }

    if (task.urgency >= 4) {
      reasons.push("time-sensitive");
    }

    if (task.projectValue >= 5) {
      reasons.push("critical to JARVIS OS");
    }

    if (task.effort <= 2) {
      reasons.push("immediately actionable");
    }

    return reasons.length
      ? `Selected because it is ${reasons.join(", ")}.`
      : "Selected as the strongest available next action.";
  }

  function displayDecision(task) {
    if (!task) {
      nextTaskElement.textContent = "No remaining tasks";
      decisionReason.textContent = "All available tasks are complete.";
      decisionStatus.textContent = "CLEAR";
      return;
    }

    nextTaskElement.textContent = task.title;
    decisionReason.textContent = explainDecision(task);
    decisionStatus.textContent = "SELECTED";
  }

  async function runDecisionEngine() {
    setState("THINKING");

    if (decisionStatus) {
      decisionStatus.textContent = "ANALYSING";
    }

    await delay(1200);

    const selectedTask = chooseNextTask();

    displayDecision(selectedTask);

    setState("RESPONDING");
    await delay(900);

    setState("COMPLETE");

    if ("vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    await delay(1600);

    setState("ONLINE");
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

    commandInput.blur();

    setState("THINKING");
    await delay(1000);

    tasks.push({
      title: command,
      priority: 3,
      urgency: 3,
      projectValue: 3,
      effort: 2,
      completed: false
    });

    if (taskText) {
      taskText.textContent = command.toUpperCase();
    }

    if (taskResult) {
      taskResult.hidden = false;
    }

    setState("RESPONDING");
    await delay(900);

    await runDecisionEngine();

    commandPanel.hidden = true;
    commandInput.value = "";

    if (taskResult) {
      taskResult.hidden = true;
    }

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
  displayDecision(chooseNextTask());
});