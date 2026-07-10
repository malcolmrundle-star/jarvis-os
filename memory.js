const JARVIS_MEMORY_KEY = "jarvis-os-memory-v1";

function loadMemory() {
  try {
    const saved = localStorage.getItem(JARVIS_MEMORY_KEY);

    if (!saved) {
      return {
        currentTask: "",
        completedTasks: [],
        lastUpdated: ""
      };
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error("JARVIS memory load failed:", error);

    return {
      currentTask: "",
      completedTasks: [],
      lastUpdated: ""
    };
  }
}

function saveMemory(memory) {
  try {
    const updatedMemory = {
      ...memory,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(
      JARVIS_MEMORY_KEY,
      JSON.stringify(updatedMemory)
    );

    return updatedMemory;
  } catch (error) {
    console.error("JARVIS memory save failed:", error);
    return memory;
  }
}

function setCurrentTask(task) {
  const memory = loadMemory();

  return saveMemory({
    ...memory,
    currentTask: task
  });
}

function completeTask(task) {
  const memory = loadMemory();

  const completedTasks = [
    ...(memory.completedTasks || []),
    {
      title: task,
      completedAt: new Date().toISOString()
    }
  ];

  return saveMemory({
    ...memory,
    currentTask: "",
    completedTasks
  });
}

function clearMemory() {
  localStorage.removeItem(JARVIS_MEMORY_KEY);
}

window.JarvisMemory = {
  loadMemory,
  saveMemory,
  setCurrentTask,
  completeTask,
  clearMemory
};