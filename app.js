document.addEventListener("DOMContentLoaded", () => {
    const REMINDERS_KEY = "jarvis-live-reminders-v1";
const CALENDAR_KEY = "jarvis-live-calendar-v1";

function saveList(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function parseLines(value) {
  return (value || "")
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function saveReminders(items) {
  saveList(REMINDERS_KEY, items);
}

function loadReminders() {
  return loadList(REMINDERS_KEY);
}

function saveCalendar(items) {
  saveList(CALENDAR_KEY, items);
}

function loadCalendar() {
  return loadList(CALENDAR_KEY);
}

function importLiveDataFromURL() {
  const params = new URLSearchParams(window.location.search);
  let imported = false;

  if (params.has("reminders")) {
    saveReminders(parseLines(params.get("reminders")));
    imported = true;
  }

  if (params.has("calendar")) {
    saveCalendar(parseLines(params.get("calendar")));
    imported = true;
  }

  if (imported) {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}
  function importRemindersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const reminderData = params.get("reminders");

    if (!reminderData) return;

    const reminders = reminderData
      .split("|||")
      .map(item => item.trim())
      .filter(Boolean);

    saveReminders(reminders);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
  const timeElement = document.getElementById("time");
  const core = document.getElementById("core");
  const stateLabel = document.querySelector(".state");
  const instruction = document.querySelector(".instruction");

  const refreshButton = document.getElementById("refresh-button");
  const briefingButton = document.getElementById("briefing-button");
  const remindersButton = document.getElementById("reminders-button");
  const calendarButton = document.getElementById("calendar-button");
  const outlookButton = document.getElementById("outlook-button");

  const systemPanel = document.getElementById("system-panel");
  const systemPanelTitle = document.getElementById("system-panel-title");
  const systemPanelContent = document.getElementById("system-panel-content");
  const systemPanelClose = document.getElementById("system-panel-close");

  function updateClock() {
    if (!timeElement) return;

    timeElement.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function setState(state) {
    if (stateLabel) {
      stateLabel.textContent = state;
    }

    if (core) {
      core.dataset.state = state.toLowerCase();
    }

    const messages = {
      ONLINE: "SYSTEM READY",
      THINKING: "PROCESSING",
      COMPLETE: "UPDATED"
    };

    if (instruction) {
      instruction.textContent = messages[state] || "";
    }
  }

  function openPanel(title, content) {
    if (!systemPanel || !systemPanelTitle || !systemPanelContent) {
      return;
    }

    systemPanelTitle.textContent = title;
    systemPanelContent.innerHTML = content;
    systemPanel.hidden = false;
  }

  function showBriefing() {
    openPanel(
      "DAILY BRIEFING",
      `
        <div class="diagnostic-row">
          <span>MISSION</span>
          <span>Build JARVIS OS</span>
        </div>

        <div class="diagnostic-row">
          <span>PRIORITY</span>
          <span class="diagnostic-value">Connect real services</span>
        </div>

        <div class="diagnostic-row">
          <span>NEXT ACTION</span>
          <span>Test dashboard controls</span>
        </div>

        <div class="diagnostic-row">
          <span>MODE</span>
          <span>BUILD</span>
        </div>
      `
    );
  }

    function showReminders() {
    const reminders = loadReminders();

    const content = reminders.length
      ? reminders
          .map((reminder, index) => `
            <div class="diagnostic-row">
              <span>${index + 1}</span>
              <span>${escapeHTML(reminder)}</span>
            </div>
          `)
          .join("")
      : `
          <div class="diagnostic-row">
            <span>STATUS</span>
            <span>No JARVIS reminders loaded</span>
          </div>
        `;

    openPanel("REMINDERS", content);
  }

  function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
  }

  function showCalendar() {
    openPanel(
      "CALENDAR",
      `
        <div class="diagnostic-row">
          <span>TODAY</span>
          <span>No events loaded</span>
        </div>

        <div class="diagnostic-row">
          <span>NEXT</span>
          <span>Calendar integration pending</span>
        </div>
      `
    );
  }

  function showOutlook() {
    openPanel(
      "OUTLOOK",
      `
        <div class="diagnostic-row">
          <span>STATUS</span>
          <span>Not connected</span>
        </div>

        <div class="diagnostic-row">
          <span>IMPORTANT</span>
          <span>0 loaded</span>
        </div>

        <div class="diagnostic-row">
          <span>NEXT</span>
          <span>Connect email briefing</span>
        </div>
      `
    );
  }

  async function runRefresh() {
    setState("THINKING");

    await new Promise(resolve => {
      setTimeout(resolve, 900);
    });

    setState("COMPLETE");

    openPanel(
      "SYSTEM REFRESH",
      `
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
          <span>STATIC DATA</span>
        </div>

        <div class="diagnostic-row">
          <span>CALENDAR</span>
          <span>NOT CONNECTED</span>
        </div>

        <div class="diagnostic-row">
          <span>OUTLOOK</span>
          <span>NOT CONNECTED</span>
        </div>
      `
    );

    setTimeout(() => {
        importRemindersFromURL();
      setState("ONLINE");
    }, 1200);
  }

  refreshButton?.addEventListener("click", runRefresh);
  briefingButton?.addEventListener("click", showBriefing);
  remindersButton?.addEventListener("click", showReminders);
  calendarButton?.addEventListener("click", showCalendar);
  outlookButton?.addEventListener("click", showOutlook);

  systemPanelClose?.addEventListener("click", () => {
    if (systemPanel) {
      systemPanel.hidden = true;
    }
  });

  core?.addEventListener("click", showBriefing);

  updateClock();
  setInterval(updateClock, 1000);

  setState("ONLINE");
});