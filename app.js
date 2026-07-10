document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "jarvis-os-tasks-v1";

  const timeElement = document.getElementById("time");
  const core = document.getElementById("core");
  const stateLabel = document.querySelector(".state");
  const instruction = document.querySelector(".instruction");

  const commandPanel = document.getElementById("command-panel");
  const commandForm = document.getElementById("command-form");
  const commandInput = document.getElementById("command-input");
  const taskResult = document.getElementById("task-result");
  const taskText = document.getElementById("task-text");

  const decisionPanel = document.getElementById("decision-panel");
  const decisionStatus = document.getElementById("decision-status");
  const nextTaskElement = document.getElementById("next-task");
  const decisionReason = document.getElementById("decision-reason");

  let busy = false;
  let selectedTaskId = null;

  const starterTasks = [
    {
      id: crypto.randomUUID(),
      title: "Start using JARVIS OS",
      priority: 5,
      urgency: 5,
      projectValue: 5,
      effort: 1,
      completed: false,
      createdAt: Date.now()
    }
  ];

  function loadTasks() {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);

      if (!savedTasks) {
        saveTasks(starterTasks);
        return starterTasks;
      }

      const parsedTasks = JSON.parse(savedTasks);

      return Array.isArray(parsedTasks) ? parsedTasks : starterTasks;
    } catch (error) {
      console.error("Unable to load JARVIS tasks:", error);
      return starterTasks;
    }
  }

  let tasks = loadTasks();

  function saveTasks(taskList = tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
  }

  function updateClock() {
    if (!timeElement) return;

    timeElement.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
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
      COMPLETE: "TASK COMPLETE"
    };

    if (instruction) {
      instruction.textContent = messages[nextState] || "";
    }
  }

  function delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  function calculateTaskScore(task) {
    const ageInHours =
      (Date.now() - (task.createdAt || Date.now())) / 3600000;

    const ageBonus = Math.min(ageInHours / 24, 3);

    return (
      task.priority * 4 +
      task.urgency * 3 +
      task.projectValue * 3 -
      task.effort +
      ageBonus
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

    if (task.priority >= 5) reasons.push("high priority");
    if (task.urgency >= 4) reasons.push("time-sensitive");
    if (task.projectValue >= 5) reasons.push("important to your active project");
    if (task.effort <= 2) reasons.push("immediately actionable");

    if (reasons.length === 0) {
      return "Selected as the strongest available next action.";
    }

    return `Selected because it is ${reasons.join(", ")}. Tap this panel when complete.`;
  }

  function displayDecision(task) {
    if (!nextTaskElement || !decisionReason || !decisionStatus) {
      return;
    }

    if (!task) {
      selectedTaskId = null;
      nextTaskElement.textContent = "No remaining tasks";
      decisionReason.textContent =
        "Tap the core and give JARVIS your next task.";
      decisionStatus.textContent = "CLEAR";
      return;
    }

    selectedTaskId = task.id;
    nextTaskElement.textContent = task.title;
    decisionReason.textContent = explainDecision(task);
    decisionStatus.textContent = "SELECTED";
  }

  function refreshDecision() {
    displayDecision(chooseNextTask());
  }

  function addTask(title) {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      priority: 3,
      urgency: 3,
      projectValue: 3,
      effort: 2,
      completed: false,
      createdAt: Date.now()
    };

    tasks.push(newTask);
    saveTasks();

    return newTask;
  }

  async function completeSelectedTask() {
    if (busy || !selectedTaskId) return;

    const selectedTask = tasks.find(task => task.id === selectedTaskId);

    if (!selectedTask) return;

    busy = true;

    setState("THINKING");

    if (decisionStatus) {
      decisionStatus.textContent = "UPDATING";
    }

    await delay(600);

    selectedTask.completed = true;
    selectedTask.completedAt = Date.now();

    saveTasks();

    setState("COMPLETE");

    if (decisionStatus) {
      decisionStatus.textContent = "COMPLETE";
    }

    if ("vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    await delay(1400);

    refreshDecision();
    setState("ONLINE");

    busy = false;
  }

  function openCommandPanel() {
    if (busy || !commandPanel || !commandInput) return;

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

    if (decisionStatus) {
      decisionStatus.textContent = "ANALYSING";
    }

    await delay(900);

    const newTask = addTask(command);

    if (taskText) {
      taskText.textContent = newTask.title.toUpperCase();
    }

    if (taskResult) {
      taskResult.hidden = false;
    }

    setState("RESPONDING");

    await delay(800);

    refreshDecision();

    setState("COMPLETE");

    if ("vibrate" in navigator) {
      navigator.vibrate([30, 50, 30]);
    }

    await delay(1300);

    commandPanel.hidden = true;
    commandInput.value = "";

    if (taskResult) {
      taskResult.hidden = true;
    }

    setState("ONLINE");

    busy = false;
  }

  if (core) {
    core.addEventListener("click", openCommandPanel);
  }

  if (decisionPanel) {
    decisionPanel.addEventListener("click", completeSelectedTask);
  }

  if (commandForm && commandInput) {
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
  }

  updateClock();
  setInterval(updateClock, 1000);

  setState("ONLINE");
  refreshDecision();
});