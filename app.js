(() => {
  "use strict";

  // =========================================================
  // JARVIS OS — LIVE DASHBOARD
  // =========================================================

  const REMINDERS_KEY = "jarvis-live-reminders-v1";
  const CALENDAR_KEY = "jarvis-live-calendar-v1";
  const SYNC_KEY = "jarvis-live-sync-v1";
  const PROJECT_KEY = "jarvis-project-info-v1";

  // Data is labelled CURRENT for five minutes after a refresh.
  const CURRENT_WINDOW_MS = 5 * 60 * 1000;

  const DEFAULT_PROJECT = {
    name: "JARVIS OS",
    status: "ACTIVE",
    phase: "LIVE DATA INTEGRATION",
    objective: "Unified iPhone command centre",
    nextStep: "Connect Outlook"
  };

  let activePanel = "";
  let refreshLocked = false;

  // =========================================================
  // GENERAL HELPERS
  // =========================================================

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        })[character]
    );
  }

  function saveList(key, items) {
    const safeItems = Array.isArray(items) ? items : [];
    localStorage.setItem(key, JSON.stringify(safeItems));
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
    return String(value || "")
      .split(/\r?\n|\|\|\|/g)
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

  function loadProject() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROJECT_KEY));

      if (saved && typeof saved === "object") {
        return {
          ...DEFAULT_PROJECT,
          ...saved
        };
      }
    } catch {
      // Use defaults.
    }

    return DEFAULT_PROJECT;
  }

  // =========================================================
  // IMPORT LIVE DATA FROM THE SHORTCUT URL
  // =========================================================

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

    if (!imported) {
      return false;
    }

    localStorage.setItem(SYNC_KEY, new Date().toISOString());

    // Remove private data from the visible browser address.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.hash
    );

    return true;
  }

  // =========================================================
  // SYNC STATUS
  // =========================================================

  function getSyncDate() {
    const saved = localStorage.getItem(SYNC_KEY);

    if (!saved) {
      return null;
    }

    const date = new Date(saved);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function getSyncAgeMilliseconds() {
    const syncDate = getSyncDate();

    if (!syncDate) {
      return null;
    }

    return Math.max(0, Date.now() - syncDate.getTime());
  }

  function getDataStatus(count) {
    const age = getSyncAgeMilliseconds();

    if (age === null) {
      return "NOT SYNCED";
    }

    if (age <= CURRENT_WINDOW_MS) {
      return `CURRENT · ${count}`;
    }

    return `CACHED · ${count}`;
  }

  function getLastSyncTime() {
    const syncDate = getSyncDate();

    if (!syncDate) {
      return "NEVER";
    }

    return syncDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getLastSyncAge() {
    const age = getSyncAgeMilliseconds();

    if (age === null) {
      return "NEVER";
    }

    const minutes = Math.floor(age / 60000);

    if (minutes < 1) {
      return "JUST NOW";
    }

    if (minutes === 1) {
      return "1 MIN AGO";
    }

    if (minutes < 60) {
      return `${minutes} MINS AGO`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours === 1) {
      return "1 HOUR AGO";
    }

    return `${hours} HOURS AGO`;
  }

  // =========================================================
  // CLOCK AND CORE STATE
  // =========================================================

  function updateClock() {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    const clockSelectors = [
      "#clock",
      "#jarvisClock",
      "#jarvis-clock",
      "#currentTime",
      "#current-time",
      "[data-clock]"
    ];

    clockSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.textContent = time;
      });
    });
  }

  function setState(state) {
    const value = String(state || "ONLINE").toUpperCase();

    document.body.dataset.jarvisState = value.toLowerCase();

    const selectors = [
      "#status",
      "#statusText",
      "#status-text",
      "#jarvisStatus",
      "#jarvis-status",
      "[data-jarvis-status]"
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.textContent = value;
      });
    });
  }

  // =========================================================
  // PANEL SYSTEM
  // =========================================================

  function findExistingPanel() {
    const panel = document.querySelector(
      [
        "#panel",
        "#infoPanel",
        "#info-panel",
        "#systemPanel",
        "#system-panel",
        "#jarvisPanel",
        "#jarvis-panel",
        ".info-panel",
        ".system-panel",
        ".jarvis-panel",
        ".modal-panel",
        "[data-panel]"
      ].join(",")
    );

    if (!panel) {
      return null;
    }

    const title = panel.querySelector(
      [
        "#panelTitle",
        "#panel-title",
        ".panel-title",
        "[data-panel-title]"
      ].join(",")
    );

    const content = panel.querySelector(
      [
        "#panelContent",
        "#panel-content",
        ".panel-content",
        ".panel-body",
        "[data-panel-content]"
      ].join(",")
    );

    const close = panel.querySelector(
      [
        "#closePanel",
        "#close-panel",
        "#panelClose",
        "#panel-close",
        ".panel-close",
        "[data-panel-close]"
      ].join(",")
    );

    return {
      panel,
      title,
      content,
      close
    };
  }

  function createFallbackPanel() {
    const panel = document.createElement("section");
    panel.id = "jarvis-live-panel";
    panel.setAttribute("data-panel", "");

    panel.style.position = "fixed";
    panel.style.left = "50%";
    panel.style.bottom = "calc(88px + env(safe-area-inset-bottom))";
    panel.style.transform = "translateX(-50%)";
    panel.style.width = "min(88vw, 620px)";
    panel.style.maxHeight = "58vh";
    panel.style.overflowY = "auto";
    panel.style.padding = "26px 28px";
    panel.style.border = "1px solid rgba(41, 222, 255, 0.28)";
    panel.style.borderRadius = "28px";
    panel.style.background = "rgba(1, 12, 18, 0.97)";
    panel.style.boxShadow =
      "0 0 40px rgba(0, 210, 255, 0.10)";
    panel.style.zIndex = "9999";
    panel.style.display = "none";
    panel.style.color = "#f5f7f8";
    panel.style.backdropFilter = "blur(18px)";

    panel.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:20px;
        padding-bottom:20px;
        border-bottom:1px solid rgba(41,222,255,0.16);
      ">
        <div
          data-panel-title
          style="
            font-size:14px;
            letter-spacing:0.32em;
            color:#8998a1;
          "
        ></div>

        <button
          type="button"
          data-panel-close
          aria-label="Close"
          style="
            width:54px;
            height:54px;
            border-radius:50%;
            border:1px solid rgba(41,222,255,0.28);
            background:transparent;
            color:#ffffff;
            font-size:36px;
            line-height:1;
          "
        >×</button>
      </div>

      <div data-panel-content style="padding-top:18px;"></div>
    `;

    document.body.appendChild(panel);

    return {
      panel,
      title: panel.querySelector("[data-panel-title]"),
      content: panel.querySelector("[data-panel-content]"),
      close: panel.querySelector("[data-panel-close]")
    };
  }

  function getPanelElements() {
    return findExistingPanel() || createFallbackPanel();
  }

  function openPanel(titleText, contentHTML) {
    const elements = getPanelElements();

    activePanel = titleText;

    if (elements.title) {
      elements.title.textContent = titleText;
    }

    if (elements.content) {
      elements.content.innerHTML = contentHTML;
    }

    elements.panel.hidden = false;
    elements.panel.style.display = "block";
    elements.panel.classList.add("active", "open", "show");
    elements.panel.dataset.activePanel = titleText;

    if (elements.close) {
      elements.close.onclick = closePanel;
    }
  }

  function closePanel() {
    const elements = getPanelElements();

    elements.panel.classList.remove("active", "open", "show");
    elements.panel.style.display = "none";
    elements.panel.hidden = true;

    activePanel = "";
  }

  function createRow(label, value, valueClass = "") {
    return `
      <div class="diagnostic-row">
        <span>${escapeHTML(label)}</span>
        <span class="${escapeHTML(valueClass)}">
          ${escapeHTML(value)}
        </span>
      </div>
    `;
  }

  // =========================================================
  // REMINDERS
  // =========================================================

  function showReminders() {
    const reminders = loadReminders();

    const content = reminders.length
      ? reminders
          .map((reminder, index) =>
            createRow(String(index + 1), reminder)
          )
          .join("")
      : createRow("STATUS", "NO JARVIS REMINDERS");

    openPanel("REMINDERS", content);
  }

  // =========================================================
  // CALENDAR
  // =========================================================

  function showCalendar() {
    const events = loadCalendar();

    const content = events.length
      ? events
          .map((event, index) =>
            createRow(String(index + 1), event)
          )
          .join("")
      : createRow("STATUS", "NO CALENDAR EVENTS");

    openPanel("CALENDAR", content);
  }

  // =========================================================
  // DAILY BRIEFING
  // =========================================================

  function showBriefing() {
    const reminders = loadReminders();
    const calendar = loadCalendar();
    const project = loadProject();

    const nextReminder =
      reminders.length > 0 ? reminders[0] : "NONE";

    const nextEvent =
      calendar.length > 0 ? calendar[0] : "NONE";

    const content = [
      createRow("PROJECT", project.name),
      createRow("PROJECT STATUS", project.status),
      createRow("CURRENT PHASE", project.phase),
      createRow("OBJECTIVE", project.objective),
      createRow("REMINDERS", String(reminders.length)),
      createRow("CALENDAR", String(calendar.length)),
      createRow("NEXT REMINDER", nextReminder),
      createRow("NEXT EVENT", nextEvent),
      createRow("NEXT SYSTEM STEP", project.nextStep),
      createRow("LAST SYNC", getLastSyncAge())
    ].join("");

    openPanel("DAILY BRIEFING", content);
  }

  // =========================================================
  // OUTLOOK
  // =========================================================

  function showOutlook() {
    const content = [
      createRow("STATUS", "NOT CONNECTED"),
      createRow("NEXT STEP", "CONNECT OUTLOOK DATA")
    ].join("");

    openPanel("OUTLOOK", content);
  }

  // =========================================================
  // SYSTEM STATUS
  // =========================================================

  function showSystemStatus() {
    const reminders = loadReminders();
    const calendar = loadCalendar();
    const project = loadProject();

    const content = [
      createRow("CORE", "ONLINE"),
      createRow("MEMORY", "INTERNAL"),
      createRow("PROJECT", `${project.name} · ${project.status}`),
      createRow(
        "REMINDERS",
        getDataStatus(reminders.length)
      ),
      createRow(
        "CALENDAR",
        getDataStatus(calendar.length)
      ),
      createRow("OUTLOOK", "NOT CONNECTED"),
      createRow("LAST SYNC", getLastSyncTime()),
      createRow("SYNC AGE", getLastSyncAge())
    ].join("");

    openPanel("SYSTEM REFRESH", content);
  }

  // =========================================================
  // LIVE REFRESH
  // =========================================================

  function runRefresh() {
    if (refreshLocked) {
      return;
    }

    refreshLocked = true;
    setState("REFRESHING");

    window.location.href =
      "shortcuts://run-shortcut?name=JARVIS%20Launch";

    window.setTimeout(() => {
      refreshLocked = false;
      setState("ONLINE");
    }, 4000);
  }

  // =========================================================
  // BUTTON CONNECTIONS
  // =========================================================

  function getActionFromElement(element) {
    if (!element) {
      return "";
    }

    const explicitAction =
      element.dataset?.action ||
      element.dataset?.jarvisAction ||
      "";

    if (explicitAction) {
      return explicitAction.toLowerCase();
    }

    return String(element.textContent || "")
      .trim()
      .toLowerCase();
  }

  function runAction(action) {
    if (!action) {
      return false;
    }

    if (action.includes("refresh")) {
      runRefresh();
      return true;
    }

    if (action.includes("briefing")) {
      showBriefing();
      return true;
    }

    if (action.includes("reminder")) {
      showReminders();
      return true;
    }

    if (action.includes("calendar")) {
      showCalendar();
      return true;
    }

    if (action.includes("outlook")) {
      showOutlook();
      return true;
    }

    if (
      action.includes("system") ||
      action.includes("diagnostic") ||
      action.includes("status")
    ) {
      showSystemStatus();
      return true;
    }

    return false;
  }

  function connectKnownButton(selectors, handler) {
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.dataset.jarvisConnected === "true") {
          return;
        }

        element.dataset.jarvisConnected = "true";

        element.addEventListener("click", event => {
          event.preventDefault();
          handler();
        });
      });
    });
  }

  function connectButtons() {
    connectKnownButton(
      [
        "#refreshButton",
        "#refresh-button",
        "#refreshBtn",
        "#refresh-btn",
        "[data-action='refresh']"
      ],
      runRefresh
    );

    connectKnownButton(
      [
        "#briefingButton",
        "#briefing-button",
        "#briefingBtn",
        "#briefing-btn",
        "[data-action='briefing']"
      ],
      showBriefing
    );

    connectKnownButton(
      [
        "#remindersButton",
        "#reminders-button",
        "#remindersBtn",
        "#reminders-btn",
        "[data-action='reminders']"
      ],
      showReminders
    );

    connectKnownButton(
      [
        "#calendarButton",
        "#calendar-button",
        "#calendarBtn",
        "#calendar-btn",
        "[data-action='calendar']"
      ],
      showCalendar
    );

    connectKnownButton(
      [
        "#outlookButton",
        "#outlook-button",
        "#outlookBtn",
        "#outlook-btn",
        "[data-action='outlook']"
      ],
      showOutlook
    );

    connectKnownButton(
      [
        "#systemButton",
        "#system-button",
        "#systemBtn",
        "#system-btn",
        "#diagnosticsButton",
        "#diagnostics-button",
        "[data-action='system']",
        "[data-action='diagnostics']"
      ],
      showSystemStatus
    );

    document.addEventListener("click", event => {
      const target = event.target.closest(
        [
          "button",
          "[role='button']",
          "[data-action]",
          "[data-jarvis-action]",
          ".action-button",
          ".menu-button",
          ".control-button"
        ].join(",")
      );

      if (!target) {
        return;
      }

      if (
        target.hasAttribute("data-panel-close") ||
        target.classList.contains("panel-close")
      ) {
        closePanel();
        return;
      }

      if (target.dataset.jarvisConnected === "true") {
        return;
      }

      const action = getActionFromElement(target);
      runAction(action);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closePanel();
      }
    });
  }

  // =========================================================
  // PERIODIC STATUS UPDATES
  // =========================================================

  function refreshVisiblePanel() {
    if (activePanel === "SYSTEM REFRESH") {
      showSystemStatus();
    }

    if (activePanel === "DAILY BRIEFING") {
      showBriefing();
    }
  }

  // =========================================================
  // INITIALISE JARVIS
  // =========================================================

  function initialiseJarvis() {
    const imported = importLiveDataFromURL();

    connectButtons();
    updateClock();
    setState("ONLINE");

    window.setInterval(updateClock, 1000);
    window.setInterval(refreshVisiblePanel, 30000);

    if (imported) {
      document.body.dataset.lastImport = "successful";
    }
  }

  // Support existing inline HTML onclick functions.
  window.runRefresh = runRefresh;
  window.showBriefing = showBriefing;
  window.showReminders = showReminders;
  window.showCalendar = showCalendar;
  window.showOutlook = showOutlook;
  window.showSystemStatus = showSystemStatus;
  window.closePanel = closePanel;
  window.importLiveDataFromURL = importLiveDataFromURL;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseJarvis
    );
  } else {
    initialiseJarvis();
  }
})();