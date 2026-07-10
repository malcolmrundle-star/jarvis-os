const JARVIS_CORE_URL = "./core.json";

function calculateScore(task) {
  return (
    task.priority * 4 +
    task.urgency * 3 +
    task.impact * 3 -
    task.effort
  );
}

function chooseNextTask(tasks = []) {
  const availableTasks = tasks.filter(
    task => task.status === "AVAILABLE"
  );

  if (availableTasks.length === 0) {
    return null;
  }

  return availableTasks
    .map(task => ({
      ...task,
      score: calculateScore(task)
    }))
    .sort((a, b) => b.score - a.score)[0];
}

function explainDecision(task) {
  const reasons = [];

  if (task.priority >= 5) {
    reasons.push("highest priority");
  }

  if (task.urgency >= 4) {
    reasons.push("urgent");
  }

  if (task.impact >= 5) {
    reasons.push("high impact");
  }

  if (task.effort <= 2) {
    reasons.push("quick to complete");
  }

  return reasons.length
    ? `Selected because it is ${reasons.join(", ")}.`
    : "Selected as the strongest available next action.";
}

async function loadJarvisCore() {
  try {
    const response = await fetch(
      `${JARVIS_CORE_URL}?updated=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error(`CORE returned ${response.status}`);
    }

    const coreState = await response.json();
    const selectedTask = chooseNextTask(coreState.tasks);

    window.JARVIS_CORE = {
      ...coreState,
      decision: {
        selectedTask: selectedTask?.title || "",
        reason: selectedTask
          ? explainDecision(selectedTask)
          : "No available tasks.",
        lastEvaluated: new Date().toISOString()
      }
    };

    updateJarvisInterface(window.JARVIS_CORE);
  } catch (error) {
    console.error("JARVIS CORE failed to load:", error);

    const decisionStatus =
      document.getElementById("decision-status");

    if (decisionStatus) {
      decisionStatus.textContent = "CORE OFFLINE";
    }
  }
}

function updateJarvisInterface(coreState) {
  const stateLabel = document.querySelector(".state");
  const nextTask = document.getElementById("next-task");
  const decisionReason =
    document.getElementById("decision-reason");
  const decisionStatus =
    document.getElementById("decision-status");

  if (stateLabel) {
    stateLabel.textContent =
      coreState.system?.status || "ONLINE";
  }

  if (nextTask) {
    nextTask.textContent =
      coreState.decision?.selectedTask ||
      "No active task";
  }

  if (decisionReason) {
    decisionReason.textContent =
      coreState.decision?.reason ||
      "Awaiting evaluation";
  }

  if (decisionStatus) {
    decisionStatus.textContent =
      coreState.decision?.selectedTask
        ? "SELECTED"
        : "CLEAR";
  }
}

document.addEventListener(
  "DOMContentLoaded",
  loadJarvisCore
);