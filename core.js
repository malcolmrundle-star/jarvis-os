const JARVIS_CORE_URL = "./core.json";

async function loadJarvisCore() {
  try {
    const response = await fetch(
      `${JARVIS_CORE_URL}?updated=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error(`CORE returned ${response.status}`);
    }

    const coreState = await response.json();

    window.JARVIS_CORE = coreState;

    updateJarvisInterface(coreState);

    console.log("JARVIS CORE loaded:", coreState);
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
      coreState.mission?.currentTask ||
      "No active task";
  }

  if (decisionReason) {
    decisionReason.textContent =
      coreState.mission?.nextAction ||
      "Awaiting next action";
  }

  if (decisionStatus) {
    decisionStatus.textContent =
      coreState.mission?.priority || "READY";
  }
}

document.addEventListener(
  "DOMContentLoaded",
  loadJarvisCore
);