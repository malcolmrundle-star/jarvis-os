function calculateTaskScore(task) {
  const priority = Number(task.priority || 0);
  const urgency = Number(task.urgency || 0);
  const impact = Number(task.impact || 0);
  const effort = Number(task.effort || 0);

  return (
    priority * 4 +
    urgency * 3 +
    impact * 3 -
    effort
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
      score: calculateTaskScore(task)
    }))
    .sort((a, b) => b.score - a.score)[0];
}

function explainDecision(task) {
  if (!task) {
    return "No available tasks.";
  }

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

window.JarvisDecision = {
  calculateTaskScore,
  chooseNextTask,
  explainDecision
};