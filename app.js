document.addEventListener("DOMContentLoaded", () => {
  const REMINDERS_KEY = "jarvis-reminders-v1";
  
const systemPanelClose =
  document.getElementById("system-panel-close");

const systemPanelTitle =
  document.getElementById("system-panel-title");
  const timeElement =
    document.getElementById("time");

  const core =
    document.getElementById("core");

  const stateLabel =
    document.querySelector(".state");

  const instruction =
    document.querySelector(".instruction");

  const remindersList =
    document.getElementById("reminders-list");

  const briefingStatus =
    document.getElementById("briefing-status");

  const refreshButton =
    document.getElementById("refresh-button");

  const diagnosticsButton =
    document.getElementById("diagnostics-button");

  const servicesButton =
    document.getElementById("services-button");

  const systemPanel =
    document.getElementById("system-panel");

  const systemPanelContent =
    document.getElementById("system-panel-content");

  function updateClock() {
    if (!timeElement) return;

    timeElement.textContent =
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
  }

  function setState(state) {
    if (stateLabel) {
      stateLabel.textContent = state;
    }

    if (core) {
      core.dataset.state =
        state.toLowerCase();
    }

    const messages = {
      ONLINE: "SYSTEM READY",
      THINKING: "READING REMINDERS",
      COMPLETE: "BRIEFING UPDATED",
      ERROR: "SERVICE ERROR"
    };

    if (instruction) {
      instruction.textContent =
        messages[state] || "";
    }
  }

  function saveReminders(reminders) {
    localStorage.setItem(
      REMINDERS_KEY,
      JSON.stringify(reminders)
    );
  }

  function loadSavedReminders() {
    try {
      return JSON.parse(
        localStorage.getItem(REMINDERS_KEY)
      ) || [];
    } catch {
      return [];
    }
  }

  function renderReminders(reminders) {
    if (!remindersList) return;

    if (!reminders.length) {
      remindersList.textContent =
        "No incomplete reminders.";
      return;
    }

    remindersList.innerHTML =
      reminders
        .map(reminder => {
          return `
            <div class="reminder-item">
              ${escapeHTML(reminder)}
            </div>
          `;
        })
        .join("");
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function readReminderDataFromURL() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const encoded =
      params.get("reminders");

    if (!encoded) {
      renderReminders(
        loadSavedReminders()
      );
      return;
    }

    try {
      const decoded =
        decodeURIComponent(encoded);

      const reminders =
        decoded
          .split("|||")
          .map(item => item.trim())
          .filter(Boolean);

      saveReminders(reminders);
      renderReminders(reminders);

      if (briefingStatus) {
        briefingStatus.textContent =
          "UPDATED";
      }

      setState("COMPLETE");

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setTimeout(() => {
        setState("ONLINE");
      }, 1800);
    } catch (error) {
      console.error(
        "Reminder import failed:",
        error
      );

      setState("ERROR");
    }
  }

  function runReminderRefresh() {
    setState("THINKING");

    if (briefingStatus) {
      briefingStatus.textContent =
        "REFRESHING";
    }

    const shortcutURL =
      "shortcuts://run-shortcut" +
      "?name=" +
      encodeURIComponent(
        "JARVIS Refresh Reminders"
      );

    window.location.href =
      shortcutURL;
  }

  function showDiagnostics() {
  const reminders = loadSavedReminders();

  if (systemPanelTitle) {
    systemPanelTitle.textContent = "DIAGNOSTICS";
  }

  systemPanelContent.innerHTML = `
    <div class="diagnostic-row">
      <span>CORE</span>
      <span class="diagnostic-value">ONLINE</span>
    </div>

    <div class="diagnostic-row">
      <span>MEMORY</span>
      <span class="diagnostic-value">ONLINE</span>
    </div>

    <div class="diagnostic-row">
      <span>REMINDERS</span>
      <span class="diagnostic-value">${reminders.length} LOADED</span>
    </div>

    <div class="diagnostic-row">
      <span>CALENDAR</span>
      <span>NOT CONNECTED</span>
    </div>

    <div class="diagnostic-row">
      <span>OUTLOOK</span>
      <span>NOT CONNECTED</span>
    </div>
  `;

  systemPanel.hidden = false;
}

  function showServices() {
  if (systemPanelTitle) {
    systemPanelTitle.textContent = "SERVICES";
  }

  systemPanelContent.innerHTML = `
    <div class="diagnostic-row">
      <span>REMINDERS</span>
      <span class="diagnostic-value">CONNECTED</span>
    </div>

    <div class="diagnostic-row">
      <span>CALENDAR</span>
      <span>COMING NEXT</span>
    </div>

    <div class="diagnostic-row">
      <span>OUTLOOK</span>
      <span>COMING NEXT</span>
    </div>

    <div class="diagnostic-row">
      <span>VOICE</span>
      <span>PLANNED</span>
    </div>
  `;

  systemPanel.hidden = false;
}

  refreshButton?.addEventListener(
    "click",
    runReminderRefresh
  );

  diagnosticsButton?.addEventListener(
    "click",
    showDiagnostics
  );

  servicesButton?.addEventListener(
    "click",
    showServices
  );

  core?.addEventListener(
    "click",
    runReminderRefresh
  );

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  setState("ONLINE");

  readReminderDataFromURL();
});
systemPanelClose?.addEventListener("click", () => {
  systemPanel.hidden = true;
});