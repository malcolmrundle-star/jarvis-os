document.addEventListener("DOMContentLoaded", () => {
  const STORAGE = {
    sync: "jarvis-live-sync-v1",
    reminders: "jarvis-live-reminders-v1",
    calendar: "jarvis-live-calendar-v1"
  };

  const elements = {
    time: document.getElementById("time"),
    core: document.getElementById("core"),
    state: document.querySelector(".state"),
    instruction: document.querySelector(".instruction"),

    refreshButton: document.getElementById("refresh-button"),
    briefingButton: document.getElementById("briefing-button"),
    remindersButton: document.getElementById("reminders-button"),
    calendarButton: document.getElementById("calendar-button"),
    outlookButton: document.getElementById("outlook-button"),

    systemPanel: document.getElementById("system-panel"),
    systemPanelTitle: document.getElementById("system-panel-title"),
    systemPanelContent: document.getElementById("system-panel-content"),
    systemPanelClose: document.getElementById("system-panel-close"),

    briefingStatus: document.getElementById("briefing-status"),
    remindersList: document.getElementById("reminders-list"),

    commandForm: document.getElementById("command-form"),
    commandInput: document.getElementById("command-input"),

    taskResult: document.getElementById("task-result"),
    taskText: document.getElementById("task-text"),
summaryReminders: document.getElementById("summary-reminders"),
    summaryCalendar: document.getElementById("summary-calendar"),
    summaryOutlook: document.getElementById("summary-outlook")
  };

  function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
  }

  function saveList(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function loadList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error("JARVIS storage error:", error);
      return [];
    }
  }

  function parseList(value) {
    if (!value) return [];

    const text = String(value).trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Shortcuts may send normal text.
    }

    return text
      .split(/\|\|\||\r?\n/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function loadReminders() {
    return loadList(STORAGE.reminders);
  }

  function loadCalendar() {
    return loadList(STORAGE.calendar);
  }

  function getLastSync() {
    return localStorage.getItem(STORAGE.sync) || "";
  }

  function formatSyncTime(value) {
    if (!value) return "NOT SYNCED";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "NOT SYNCED";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function updateClock() {
    if (!elements.time) return;

    elements.time.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function setState(state, message) {
    const status = String(state || "ONLINE").toUpperCase();

    if (elements.state) {
      elements.state.textContent = status;
    }

    if (elements.core) {
      elements.core.dataset.state = status.toLowerCase();
    }

    const messages = {
      ONLINE: "SYSTEM READY",
      THINKING: "PROCESSING",
      RESPONDING: "COMMAND RECEIVED",
      COMPLETE: "UPDATED"
    };

    if (elements.instruction) {
      elements.instruction.textContent =
        message || messages[status] || "";
    }
  }

  function openPanel(title, content) {
    if (
      !elements.systemPanel ||
      !elements.systemPanelTitle ||
      !elements.systemPanelContent
    ) {
      return;
    }

    elements.systemPanelTitle.textContent = title;
    elements.systemPanelContent.innerHTML = content;
    elements.systemPanel.hidden = false;

    elements.systemPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  function closePanel() {
    if (elements.systemPanel) {
      elements.systemPanel.hidden = true;
    }
  }

  function renderLiveSummary() {
    const reminders = loadReminders();
    const calendar = loadCalendar();

    if (elements.summaryReminders) {
      elements.summaryReminders.textContent =
        String(reminders.length);
    }

    if (elements.summaryCalendar) {
      elements.summaryCalendar.textContent =
        String(calendar.length);
    }

    if (elements.summaryOutlook) {
      elements.summaryOutlook.textContent = "OFFLINE";
    }
  }

  function renderBriefing() {
    const reminders = loadReminders();
    const lastSync = getLastSync();

    if (elements.briefingStatus) {
      elements.briefingStatus.textContent = lastSync
        ? `SYNCED ${formatSyncTime(lastSync)}`
        : "READY";
    }

    if (!elements.remindersList) return;

    if (!reminders.length) {
      elements.remindersList.textContent =
        "No reminder data loaded.";
      return;
    }

    elements.remindersList.innerHTML = reminders
      .slice(0, 5)
      .map(
        (reminder, index) =>
          `<div>${index + 1}. ${escapeHTML(reminder)}</div>`
      )
      .join("");
  }

  function renderCurrentTask() {
    const memory = window.JarvisMemory?.loadMemory?.();
    const currentTask = memory?.currentTask || "";

    if (!elements.taskResult || !elements.taskText) return;

    elements.taskText.textContent = currentTask;
    elements.taskResult.hidden = !currentTask;
  }

  function refreshInterface() {
    renderBriefing();
    renderLiveSummary();
    renderCurrentTask();
  }

  function importLiveDataFromURL() {
    const params = new URLSearchParams(window.location.search);
    let imported = false;

    if (params.has("reminders")) {
      saveList(
        STORAGE.reminders,
        parseList(params.get("reminders"))
      );

      imported = true;
    }

    if (params.has("calendar")) {
      saveList(
        STORAGE.calendar,
        parseList(params.get("calendar"))
      );

      imported = true;
    }

    if (!imported) {
      refreshInterface();
      return false;
    }

    localStorage.setItem(
      STORAGE.sync,
      new Date().toISOString()
    );

    refreshInterface();
    setState("COMPLETE", "SHORTCUT DATA IMPORTED");

    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${window.location.hash}`
    );

    window.setTimeout(() => {
      setState("ONLINE");
    }, 1200);

    return true;
  }

  function showBriefing() {
    const reminders = loadReminders();
    const calendar = loadCalendar();

    const currentTask =
      window.JarvisMemory?.loadMemory?.()?.currentTask ||
      "No active task";

    openPanel(
      "DAILY BRIEFING",
      `
        <div><strong>MODE</strong> BUILD</div>

        <div>
          <strong>CURRENT TASK</strong>
          ${escapeHTML(currentTask)}
        </div>

        <div>
          <strong>REMINDERS</strong>
          ${reminders.length}
        </div>

        <div>
          <strong>CALENDAR</strong>
          ${calendar.length}
        </div>

        <div>
          <strong>LAST SYNC</strong>
          ${escapeHTML(formatSyncTime(getLastSync()))}
        </div>
      `
    );
  }

  function showReminders() {
    const reminders = loadReminders();

    if (!reminders.length) {
      openPanel(
        "REMINDERS",
        "<div>No reminders loaded.</div>"
      );

      return;
    }

    const content = reminders
      .map(
        (reminder, index) =>
          `<div>${index + 1}. ${escapeHTML(reminder)}</div>`
      )
      .join("");

    openPanel("REMINDERS", content);
  }

  function showCalendar() {
    const calendar = loadCalendar();

    if (!calendar.length) {
      openPanel(
        "CALENDAR",
        "<div>No calendar events loaded.</div>"
      );

      return;
    }

    const content = calendar
      .map(
        (event, index) =>
          `<div>${index + 1}. ${escapeHTML(event)}</div>`
      )
      .join("");

    openPanel("CALENDAR", content);
  }

  function showOutlook() {
    openPanel(
      "OUTLOOK",
      `
        <div><strong>STATUS</strong> NOT CONNECTED</div>
        <div>Outlook integration is the next service connection.</div>
      `
    );
  }

  function showSystemStatus() {
    const reminders = loadReminders();
    const calendar = loadCalendar();

    openPanel(
      "SYSTEM STATUS",
      `
        <div>CORE ONLINE</div>
        <div>
          MEMORY ${window.JarvisMemory ? "ONLINE" : "OFFLINE"}
        </div>
        <div>REMINDERS ${reminders.length} LOADED</div>
        <div>CALENDAR ${calendar.length} LOADED</div>
        <div>OUTLOOK NOT CONNECTED</div>
        <div>
          LAST SYNC
          ${escapeHTML(formatSyncTime(getLastSync()))}
        </div>
      `
    );
  }

  async function runRefresh() {
    setState("THINKING");

    await new Promise(resolve => {
      window.setTimeout(resolve, 350);
    });

    importLiveDataFromURL();
    refreshInterface();
    showSystemStatus();

    setState("COMPLETE");

    window.setTimeout(() => {
      setState("ONLINE");
    }, 1000);
  }

  function saveTask(command) {
    const task = command.trim();

    if (!task) return;

    window.JarvisMemory?.setCurrentTask?.(task);

    renderCurrentTask();
    setState("COMPLETE", "TASK SAVED");

    openPanel(
      "COMMAND ACCEPTED",
      `
        <div><strong>CURRENT TASK</strong></div>
        <div>${escapeHTML(task)}</div>
      `
    );

    window.setTimeout(() => {
      setState("ONLINE");
    }, 1000);
  }

  function runCommand(command) {
    const normalized = command.trim().toLowerCase();

    if (!normalized) return;

    setState("RESPONDING");

    if (
      normalized === "refresh" ||
      normalized.includes("system refresh")
    ) {
      runRefresh();
      return;
    }

    if (normalized.includes("briefing")) {
      showBriefing();
      setState("ONLINE");
      return;
    }

    if (normalized.includes("reminder")) {
      showReminders();
      setState("ONLINE");
      return;
    }

    if (normalized.includes("calendar")) {
      showCalendar();
      setState("ONLINE");
      return;
    }

    if (
      normalized.includes("outlook") ||
      normalized.includes("email")
    ) {
      showOutlook();
      setState("ONLINE");
      return;
    }

    if (normalized.includes("status")) {
      showSystemStatus();
      setState("ONLINE");
      return;
    }

    saveTask(command);
  }

  elements.refreshButton?.addEventListener(
    "click",
    runRefresh
  );

  elements.briefingButton?.addEventListener(
    "click",
    showBriefing
  );

  elements.remindersButton?.addEventListener(
    "click",
    showReminders
  );

  elements.calendarButton?.addEventListener(
    "click",
    showCalendar
  );

  elements.outlookButton?.addEventListener(
    "click",
    showOutlook
  );

  elements.systemPanelClose?.addEventListener(
    "click",
    closePanel
  );

  elements.core?.addEventListener(
    "click",
    showBriefing
  );

  elements.commandForm?.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const command = elements.commandInput?.value || "";

      runCommand(command);

      if (elements.commandInput) {
        elements.commandInput.value = "";
        elements.commandInput.blur();
      }
    }
  );

  updateClock();
  window.setInterval(updateClock, 1000);

  importLiveDataFromURL();
  refreshInterface();
  setState("ONLINE");
});