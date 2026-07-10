const JARVIS_CORE_URL = "./core.json";

function calculateCoreScore(task) {
  return (
    Number(task.priority || 0) * 4 +
    Number(task.urgency || 0) * 3 +
    Number(task.impact || 0) * 3 -
    Number(task.effort || 0)
  );
}

function chooseCoreTask(tasks = []) {
  if (window.JarvisDecision?.chooseNextTask) {
    return window.JarvisDecision.chooseNextTask(tasks);
  }

  return (
    tasks
      .filter(task => task.status === "AVAILABLE")
      .map(task => ({
        ...task,
        score: calculateCoreScore(task)
      }))
      .sort((a, b) => b.score - a.score)[0] || null
  );
}

function explainCoreDecision(task) {
  if (window.JarvisDecision?.explainDecision) {
    return window.JarvisDecision.explainDecision(task);
  }

  return task
    ? "Selected as the strongest available next action."
    : "No available tasks.";
}

function updateJarvisInterface(coreState) {
  const stateLabel = document.querySelector(".state");
  const nextTask = document.getElementById("next-task");
  const decisionReason = document.getElementById("decision-reason");
  const decisionStatus = document.getElementById("decision-status");

  if (stateLabel && coreState.system?.status) {
    stateLabel.textContent = coreState.system.status;
  }

  if (nextTask) {
    nextTask.textContent =
      coreState.decision?.selectedTask || "No active task";
  }

  if (decisionReason) {
    decisionReason.textContent =
      coreState.decision?.reason || "Awaiting evaluation";
  }

  if (decisionStatus) {
    decisionStatus.textContent =
      coreState.decision?.selectedTask
        ? "SELECTED"
        : "CLEAR";
  }
}

async function loadJarvisCore() {
  try {
    const response = await fetch(
      `${JARVIS_CORE_URL}?updated=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`CORE returned ${response.status}`);
    }

    const coreState = await response.json();
    const selectedTask = chooseCoreTask(coreState.tasks || []);

    window.JARVIS_CORE = {
      ...coreState,
      decision: {
        selectedTask: selectedTask?.title || "",
        reason: explainCoreDecision(selectedTask),
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

document.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(loadJarvisCore, 250);
});