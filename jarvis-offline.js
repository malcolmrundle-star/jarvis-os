const fm = FileManager.local();
const root = fm.joinPath(fm.documentsDirectory(), "JARVIS");
const statePath = fm.joinPath(root, "jarvis-state.json");

if (!fm.fileExists(root)) {
  fm.createDirectory(root);
}

// ─────────────────────────────────────────────
// NATIVE DATA
// ─────────────────────────────────────────────

function readExistingState() {
  if (!fm.fileExists(statePath)) return {};

  try {
    return JSON.parse(fm.readString(statePath));
  } catch (_) {
    return {};
  }
}

function saveState(state) {
  fm.writeString(statePath, JSON.stringify(state, null, 2));
}

async function refreshNativeData() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const calendarEvents = await CalendarEvent.between(start, end);
  const reminders = await Reminder.allIncomplete();
  const existing = readExistingState();

  const state = {
    ...existing,
    updatedAt: new Date().toISOString(),
    systemMode: "OFFLINE",
    outlookStatus: "OFFLINE",

    calendar: calendarEvents.map(event => ({
      title: event.title || "Untitled event",
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.location || "",
      allDay: event.isAllDay
    })),

    reminders: reminders.map(reminder => ({
      title: reminder.title || "Untitled reminder",
      dueDate: reminder.dueDate
        ? reminder.dueDate.toISOString()
        : null,
      notes: reminder.notes || ""
    })),

    currentTask: existing.currentTask || ""
  };

  saveState(state);
  return state;
}

function updateCurrentTask(task) {
  const state = readExistingState();
  state.currentTask = String(task || "").trim();
  state.updatedAt = new Date().toISOString();

  saveState(state);
  return state;
}

let state = await refreshNativeData();

// ─────────────────────────────────────────────
// FULL JARVIS INTERFACE
// ─────────────────────────────────────────────

const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport"
content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<style>
:root {
  --bg: #01070b;
  --panel: rgba(3, 17, 23, 0.94);
  --line: #124c5c;
  --cyan: #66e7f8;
  --text: #dcf8fc;
  --muted: #78939b;
  --green: #54f495;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  padding: 34px 20px 90px;
  background:
    radial-gradient(circle at 50% 23%, rgba(0, 194, 225, .10), transparent 32%),
    linear-gradient(#010b10, #01060a 55%, #000306);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 4px 4px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  letter-spacing: 6px;
  color: #97adb4;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 15px var(--green);
}

#clock {
  color: #70828a;
  letter-spacing: 4px;
  font-size: 13px;
}

.reactor-wrap {
  height: 360px;
  display: grid;
  place-items: center;
  position: relative;
}

.reactor {
  width: 240px;
  height: 240px;
  position: relative;
  display: grid;
  place-items: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(65, 220, 244, .45);
}

.ring.one {
  width: 230px;
  height: 230px;
  animation: spin 18s linear infinite;
  border-style: dashed;
}

.ring.two {
  width: 180px;
  height: 180px;
  border-width: 2px;
  animation: spinReverse 12s linear infinite;
}

.ring.three {
  width: 125px;
  height: 125px;
  border-width: 3px;
  box-shadow: inset 0 0 26px rgba(57, 222, 245, .22);
}

.core {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background:
    radial-gradient(circle,
      white 0 18%,
      #9df7ff 20%,
      #3bdcf0 45%,
      rgba(25, 209, 232, .3) 70%);
  box-shadow:
    0 0 20px white,
    0 0 50px #3deaff,
    0 0 90px rgba(38, 218, 242, .85);
  animation: pulse 2.2s ease-in-out infinite;
}

.orbit-dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d5fbff;
  box-shadow: 0 0 12px #b7f8ff;
}

.dot-a {
  top: 22px;
  left: 92px;
}

.dot-b {
  right: 12px;
  top: 95px;
}

@keyframes pulse {
  50% {
    transform: scale(1.08);
    filter: brightness(1.3);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spinReverse {
  to { transform: rotate(-360deg); }
}

.status-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid var(--line);
  border-radius: 23px;
  background: var(--panel);
  overflow: hidden;
  margin-bottom: 24px;
}

.status-cell {
  padding: 20px 8px;
  text-align: center;
  border-right: 1px solid rgba(35, 102, 118, .45);
}

.status-cell:last-child {
  border-right: 0;
}

.status-label {
  color: #7ca4af;
  letter-spacing: 2px;
  font-size: 10px;
}

.status-value {
  margin-top: 9px;
  font-size: 23px;
  font-weight: 600;
}

.status-value.outlook {
  font-size: 13px;
  letter-spacing: 2px;
  color: #92aab1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, .28);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(28, 85, 98, .45);
}

.panel-title {
  letter-spacing: 5px;
  color: #879ba3;
  font-size: 12px;
}

#sync-time {
  color: var(--green);
  letter-spacing: 3px;
  font-size: 10px;
}

.section-title {
  color: var(--cyan);
  letter-spacing: 4px;
  font-size: 11px;
  margin: 17px 0 10px;
}

.brief-line {
  color: #dbeff2;
  line-height: 1.45;
  margin-bottom: 8px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 11px;
  margin-bottom: 18px;
}

button {
  min-height: 51px;
  border-radius: 17px;
  border: 1px solid #17596a;
  background: rgba(5, 24, 31, .96);
  color: #d9f8fc;
  font-size: 12px;
  letter-spacing: 2px;
}

button:active {
  transform: scale(.98);
  background: #0a2831;
}

button:disabled {
  opacity: .55;
}

.primary {
  grid-column: span 2;
  border-color: #278095;
}

.command-row {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  min-width: 0;
  padding: 16px;
  border-radius: 17px;
  border: 1px solid #154e5d;
  background: #031218;
  color: white;
  outline: none;
  font-size: 15px;
}

input::placeholder {
  color: #56717a;
}

.command-row button {
  width: 90px;
}

.task-text {
  min-height: 24px;
  color: #e4f8fb;
  font-size: 17px;
  line-height: 1.45;
}

.empty {
  color: #71878e;
}

.footer-status {
  text-align: center;
  color: #55727a;
  letter-spacing: 3px;
  font-size: 9px;
  margin-top: 24px;
}

.modal {
  display: none;
  position: fixed;
  inset: 0;
  padding: 70px 18px 30px;
  background: rgba(0, 4, 7, .82);
  backdrop-filter: blur(13px);
  z-index: 99;
}

.modal.open {
  display: block;
}

.modal-card {
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid #155365;
  border-radius: 27px;
  padding: 22px;
  background: #020d12;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #123c47;
}

.modal-title {
  color: #8ea8af;
  letter-spacing: 5px;
  font-size: 12px;
}

.close-button {
  width: 50px;
  height: 50px;
  min-height: 0;
  border-radius: 50%;
  font-size: 24px;
}

.item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(24, 70, 80, .5);
  line-height: 1.45;
}

.item:last-child {
  border-bottom: 0;
}

.item-time {
  color: var(--cyan);
  font-weight: 600;
}

.item-detail {
  color: #78939a;
  font-size: 13px;
  margin-top: 5px;
}
</style>
</head>

<body>

<div class="topbar">
  <div class="brand">
    <span class="status-dot"></span>
    JARVIS OS
  </div>
  <div id="clock"></div>
</div>

<div class="reactor-wrap">
  <div class="reactor">
    <div class="ring one"></div>
    <div class="ring two"></div>
    <div class="ring three"></div>
    <div class="orbit-dot dot-a"></div>
    <div class="orbit-dot dot-b"></div>
    <div class="core"></div>
  </div>
</div>

<div class="status-strip">
  <div class="status-cell">
    <div class="status-label">REMINDERS</div>
    <div class="status-value" id="reminder-count">0</div>
  </div>

  <div class="status-cell">
    <div class="status-label">CALENDAR</div>
    <div class="status-value" id="calendar-count">0</div>
  </div>

  <div class="status-cell">
    <div class="status-label">OUTLOOK</div>
    <div class="status-value outlook">OFFLINE</div>
  </div>
</div>

<div class="panel">
  <div class="panel-head">
    <div class="panel-title">DAILY BRIEFING</div>
    <div id="sync-time">LOCAL</div>
  </div>

  <div class="section-title">REMINDERS</div>
  <div class="brief-line" id="reminder-brief"></div>

  <div class="section-title">CALENDAR</div>
  <div class="brief-line" id="calendar-brief"></div>
</div>

<div class="button-grid">
  <button class="primary" id="refresh-button" onclick="requestRefresh()">
    REFRESH
  </button>

  <button onclick="showBriefing()">BRIEFING</button>
  <button onclick="openModal('reminders-modal')">REMINDERS</button>
  <button onclick="openModal('calendar-modal')">CALENDAR</button>
  <button onclick="showOutlook()">OUTLOOK</button>
</div>

<div class="panel">
  <div class="panel-title">COMMAND</div>

  <div class="command-row" style="margin-top:16px">
    <input
      id="command-input"
      placeholder="Give JARVIS a task"
      autocomplete="off"
    >
    <button onclick="saveTask()">SET</button>
  </div>
</div>

<div class="panel">
  <div class="panel-title">CURRENT TASK</div>
  <div class="task-text empty" id="task-text" style="margin-top:17px">
    No active task.
  </div>
</div>

<div class="footer-status" id="system-footer">
  LOCAL SYSTEM ONLINE
</div>

<div class="modal" id="calendar-modal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title">CALENDAR</div>
      <button class="close-button" onclick="closeModals()">×</button>
    </div>
    <div id="calendar-items"></div>
  </div>
</div>

<div class="modal" id="reminders-modal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title">REMINDERS</div>
      <button class="close-button" onclick="closeModals()">×</button>
    </div>
    <div id="reminder-items"></div>
  </div>
</div>

<div class="modal" id="message-modal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title" id="message-title">JARVIS</div>
      <button class="close-button" onclick="closeModals()">×</button>
    </div>
    <div id="message-body" class="item"></div>
  </div>
</div>

<script>
let jarvisState = {};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
}

setInterval(updateClock, 1000);
updateClock();

function formatTime(dateString, allDay) {
  if (allDay) return "ALL DAY";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderJarvis(data) {
  jarvisState = data || {};

  const calendar = Array.isArray(data.calendar)
    ? data.calendar
    : [];

  const reminders = Array.isArray(data.reminders)
    ? data.reminders
    : [];

  document.getElementById("calendar-count").textContent =
    calendar.length;

  document.getElementById("reminder-count").textContent =
    reminders.length;

  document.getElementById("reminder-brief").textContent =
    reminders.length
      ? reminders.slice(0, 2).map(item => item.title).join(" • ")
      : "No reminders requiring attention.";

  document.getElementById("calendar-brief").textContent =
    calendar.length
      ? calendar.slice(0, 2).map(item =>
          formatTime(item.startDate, item.allDay) +
          " — " +
          item.title
        ).join(" • ")
      : "No upcoming calendar events.";

  document.getElementById("calendar-items").innerHTML =
    calendar.length
      ? calendar.map(item => \`
          <div class="item">
            <div>
              <span class="item-time">
                \${formatTime(item.startDate, item.allDay)}
              </span>
              — \${escapeHTML(item.title)}
            </div>
            \${item.location
              ? \`<div class="item-detail">\${escapeHTML(item.location)}</div>\`
              : ""}
          </div>
        \`).join("")
      : '<div class="item empty">No calendar events.</div>';

  document.getElementById("reminder-items").innerHTML =
    reminders.length
      ? reminders.map(item => \`
          <div class="item">
            <div>\${escapeHTML(item.title)}</div>
            \${item.dueDate
              ? \`<div class="item-detail">
                   Due \${new Date(item.dueDate).toLocaleString()}
                 </div>\`
              : ""}
          </div>
        \`).join("")
      : '<div class="item empty">No reminders.</div>';

  const task = String(data.currentTask || "").trim();
  const taskText = document.getElementById("task-text");

  taskText.textContent = task || "No active task.";
  taskText.classList.toggle("empty", !task);

  const synced = data.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      })
    : "LOCAL";

  document.getElementById("sync-time").textContent =
    "SYNCED " + synced;

  const refreshButton =
    document.getElementById("refresh-button");

  refreshButton.disabled = false;
  refreshButton.textContent = "REFRESH";

  document.getElementById("system-footer").textContent =
    "LOCAL SYSTEM ONLINE";
}

function requestRefresh() {
  const button =
    document.getElementById("refresh-button");

  button.disabled = true;
  button.textContent = "REFRESHING…";

  document.getElementById("system-footer").textContent =
    "READING LOCAL DATA";

  sendBridge({
    action: "refresh"
  });
}

function saveTask() {
  const input =
    document.getElementById("command-input");

  const task = input.value.trim();

  if (!task) return;

  sendBridge({
    action: "setTask",
    task
  });

  input.value = "";
}

function sendBridge(detail) {
  window.dispatchEvent(
    new CustomEvent("JARVIS_BRIDGE", {
      detail
    })
  );
}

function openModal(id) {
  closeModals();
  document.getElementById(id).classList.add("open");
}

function closeModals() {
  document
    .querySelectorAll(".modal")
    .forEach(modal => modal.classList.remove("open"));
}

function showMessage(title, body) {
  document.getElementById("message-title").textContent =
    title;

  document.getElementById("message-body").textContent =
    body;

  openModal("message-modal");
}

function showBriefing() {
  const calendar = jarvisState.calendar || [];
  const reminders = jarvisState.reminders || [];

  let message =
    reminders.length +
    " reminders and " +
    calendar.length +
    " calendar events are currently loaded.";

  if (jarvisState.currentTask) {
    message +=
      "\\n\\nCurrent task: " +
      jarvisState.currentTask;
  }

  showMessage("DAILY BRIEFING", message);
}

function showOutlook() {
  showMessage(
    "OUTLOOK",
    "Outlook requires an internet connection. Offline email data is not currently available."
  );
}

renderJarvis(${JSON.stringify(state)});
</script>

</body>
</html>
`;

const webView = new WebView();
await webView.loadHTML(html);

// ─────────────────────────────────────────────
// WEBVIEW BRIDGE
// ─────────────────────────────────────────────

async function listenForCommands() {
  while (true) {
    try {
      const command = await webView.evaluateJavaScript(`
        (() => {
          const handler = event => {
            window.removeEventListener(
              "JARVIS_BRIDGE",
              handler
            );

            completion(event.detail);
          };

          window.addEventListener(
            "JARVIS_BRIDGE",
            handler
          );
        })();
      `, true);

      if (!command) continue;

      if (command.action === "refresh") {
        const updatedState = await refreshNativeData();

        await webView.evaluateJavaScript(`
          renderJarvis(${JSON.stringify(updatedState)});
        `);
      }

      if (command.action === "setTask") {
        const updatedState =
          updateCurrentTask(command.task);

        await webView.evaluateJavaScript(`
          renderJarvis(${JSON.stringify(updatedState)});
        `);
      }
    } catch (_) {
      break;
    }
  }
}

listenForCommands();
await webView.present(true);

Script.complete();