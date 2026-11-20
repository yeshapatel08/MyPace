
// MyPace stores this information in this browser using localStorage.
const TASK_KEY = "mypace.tasks.v1";
const EVENT_KEY = "mypace.events.v1";
const HABIT_KEY = "mypace.habits.v1";

const $ = (id) => document.getElementById(id);
const today = new Date();

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const prettyDate = (key, options = {
  weekday: "long",
  day: "numeric",
  month: "long"
}) => parseDate(key).toLocaleDateString(undefined, options);

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let tasks = loadArray(TASK_KEY);
let events = loadArray(EVENT_KEY);
let habitsByDate = {};

try {
  habitsByDate = JSON.parse(localStorage.getItem(HABIT_KEY)) || {};
} catch {
  habitsByDate = {};
}


// ---------- TASKS ----------

const taskList = $("task-list");
const taskDialog = $("task-dialog");
const taskForm = $("task-form");

function renderTasks() {
  taskList.querySelectorAll(".task-row").forEach((row) => row.remove());

  const empty = taskList.querySelector(".empty");

  if (empty) {
    empty.hidden = tasks.length > 0;
  }

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-row" + (task.completed ? " done" : "");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = Boolean(task.completed);
    check.setAttribute("aria-label", "Mark task complete");

    check.addEventListener("change", () => {
      task.completed = check.checked;
      saveValue(TASK_KEY, tasks);
      renderTasks();
      renderCalendar();
    });

    const main = document.createElement("div");
    main.className = "task-main";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    [
      task.category,
      task.duration,
      task.priority,
      task.dueDate
        ? `Due ${prettyDate(task.dueDate, {
            day: "numeric",
            month: "short"
          })}`
        : "No due date"
    ].forEach((value) => {
      const item = document.createElement("span");
      item.textContent = value;

      if (value === "Important") {
        item.className = "task-priority";
      }

      meta.append(item);
    });

    main.append(title, meta);

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete task");

    remove.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveValue(TASK_KEY, tasks);
      renderTasks();
      renderCalendar();
    });

    row.append(check, main, remove);
    taskList.append(row);
  });

  const completed = tasks.filter((task) => task.completed).length;

  const openImportant = tasks.filter(
    (task) => !task.completed && task.priority === "Important"
  ).length;

  $("completed-count").textContent =
    `${String(completed).padStart(2, "0")} / ${String(tasks.length).padStart(2, "0")}`;

  $("priority-count").textContent =
    String(openImportant).padStart(2, "0");

  $("task-summary").textContent = tasks.length
    ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} in your list`
    : "Your tasks will appear here.";

  $("completion-caption").textContent = tasks.length
    ? `${completed} of ${tasks.length} completed`
    : "Your day is still taking shape";
}


// OPEN TASK DIALOG

$("add-task-open").addEventListener("click", () => {
  taskForm.reset();
  $("task-due").value = dateKey(today);
  taskDialog.showModal();
  $("task-title").focus();
});

function closeTaskDialog() {
  taskDialog.close();
}

$("dialog-close").addEventListener("click", closeTaskDialog);
$("dialog-cancel").addEventListener("click", closeTaskDialog);


// ADD NEW TASK

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(taskForm);
  const title = String(data.get("title") || "").trim();

  if (!title) return;

  tasks.unshift({
    id: `${Date.now()}-${Math.random()}`,
    title,
    category: data.get("category"),
    priority: data.get("priority"),
    duration: data.get("duration"),
    dueDate: data.get("dueDate") || "",
    completed: false
  });

  saveValue(TASK_KEY, tasks);
  renderTasks();
  renderCalendar();
  closeTaskDialog();
});


// CLEAR COMPLETED TASKS

$("clear-completed").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveValue(TASK_KEY, tasks);
  renderTasks();
  renderCalendar();
});


// ---------- CALENDAR + EVENTS ----------

let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = dateKey(today);

const calendarDays = $("calendar-days");

function renderCalendar() {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  $("month-title").textContent =
    visibleMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

  calendarDays.replaceChildren();

  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalCells =
    Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNumber = cell - mondayOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const key = dateKey(cellDate);

    const inMonth =
      dayNumber >= 1 && dayNumber <= daysInMonth;

    const dayEvents = events.filter(
      (item) => item.date === key
    );

    const dayTasks = tasks.filter(
      (item) => item.dueDate === key && !item.completed
    );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";

    if (!inMonth) button.classList.add("outside-month");
    if (key === dateKey(today)) button.classList.add("is-today");
    if (key === selectedDate) button.classList.add("is-selected");

    button.setAttribute(
      "aria-label",
      `${prettyDate(key)}${dayEvents.length ? `, ${dayEvents.length} events` : ""}${dayTasks.length ? `, ${dayTasks.length} tasks due` : ""}`
    );

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(cellDate.getDate());

    button.append(number);

    if (dayEvents.length || dayTasks.length) {
      const markers = document.createElement("span");
      markers.className = "day-markers";

      if (dayEvents.length) {
        const eventDot = document.createElement("i");
        eventDot.className = "event-marker";
        markers.append(eventDot);
      }

      if (dayTasks.length) {
        const taskDot = document.createElement("i");
        taskDot.className = "task-marker";
        markers.append(taskDot);
      }

      button.append(markers);
    }

    button.addEventListener("click", () => {
      selectedDate = key;

      if (!inMonth) {
        visibleMonth = new Date(
          cellDate.getFullYear(),
          cellDate.getMonth(),
          1
        );
      }

      renderCalendar();
      renderSelectedDay();
    });

    calendarDays.append(button);
  }

  renderSelectedDay();
}


// SHOW SELECTED DAY'S EVENTS AND TASKS

function renderSelectedDay() {
  $("selected-date-title").textContent =
    prettyDate(selectedDate);

  const container = $("selected-day-items");
  container.replaceChildren();

  const dayEvents = events
    .filter((item) => item.date === selectedDate)
    .sort((a, b) =>
      (a.time || "99:99").localeCompare(b.time || "99:99")
    );

  const dayTasks = tasks.filter(
    (item) => item.dueDate === selectedDate && !item.completed
  );

  if (!dayEvents.length && !dayTasks.length) {
    const empty = document.createElement("p");
    empty.className = "day-empty";
    empty.textContent =
      "Nothing planned yet. Leave some room to breathe.";

    container.append(empty);
    return;
  }

  dayEvents.forEach((item) => {
    const card = document.createElement("div");
    card.className = "day-item event-item";

    const info = document.createElement("div");

    const title = document.createElement("b");
    title.textContent = item.title;

    const note = document.createElement("small");
    note.textContent =
      `${item.time || "Time not set"}${item.note ? ` · ${item.note}` : ""}`;

    info.append(title, note);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-task";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete event ${item.title}`);

    remove.addEventListener("click", () => {
      events = events.filter((event) => event.id !== item.id);
      saveValue(EVENT_KEY, events);
      renderCalendar();
    });

    card.append(info, remove);
    container.append(card);
  });

  dayTasks.forEach((item) => {
    const card = document.createElement("div");
    card.className = "day-item task-item";

    const info = document.createElement("div");

    const title = document.createElement("b");
    title.textContent = item.title;

    const note = document.createElement("small");
    note.textContent = `Task due · ${item.category}`;

    info.append(title, note);
    card.append(info);
    container.append(card);
  });
}


// MONTH NAVIGATION

$("prev-month").addEventListener("click", () => {
  visibleMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1
  );

  renderCalendar();
});

$("next-month").addEventListener("click", () => {
  visibleMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    1
  );

  renderCalendar();
});

$("calendar-today").addEventListener("click", () => {
  visibleMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  selectedDate = dateKey(today);
  renderCalendar();
});


// ADD EVENT DIALOG

const eventDialog = $("event-dialog");
const eventForm = $("event-form");

$("add-event-open").addEventListener("click", () => {
  eventForm.reset();
  $("event-date").value = selectedDate;
  eventDialog.showModal();
  $("event-title").focus();
});

function closeEventDialog() {
  eventDialog.close();
}

$("event-dialog-close").addEventListener("click", closeEventDialog);
$("event-cancel").addEventListener("click", closeEventDialog);


// SAVE EVENT

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(eventForm);

  const title = String(data.get("title") || "").trim();
  const date = data.get("date");

  if (!title || !date) return;

  events.push({
    id: `${Date.now()}-${Math.random()}`,
    title,
    date,
    time: data.get("time") || "",
    note: String(data.get("note") || "").trim()
  });

  selectedDate = date;

  const chosen = parseDate(date);

  visibleMonth = new Date(
    chosen.getFullYear(),
    chosen.getMonth(),
    1
  );

  saveValue(EVENT_KEY, events);
  renderCalendar();
  closeEventDialog();
});


// ---------- DAILY HABITS ----------

const habitInputs = [
  ...document.querySelectorAll("[data-habit]")
];

function renderHabits() {
  const todayKey = dateKey(today);
  const completed = habitsByDate[todayKey] || {};

  let count = 0;

  habitInputs.forEach((input) => {
    input.checked = Boolean(completed[input.dataset.habit]);

    input.closest(".habit-item").classList.toggle(
      "habit-done",
      input.checked
    );

    if (input.checked) count += 1;
  });

  $("habit-count").textContent =
    `${count} / ${habitInputs.length} DONE`;

  $("habit-progress-fill").style.width =
    `${(count / habitInputs.length) * 100}%`;

  $("habit-progress-text").textContent =
    count === habitInputs.length
      ? "You showed up for yourself today. Lovely."
      : `${count} of ${habitInputs.length} little promises kept`;
}

habitInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const todayKey = dateKey(today);

    if (!habitsByDate[todayKey]) {
      habitsByDate[todayKey] = {};
    }

    habitsByDate[todayKey][input.dataset.habit] =
      input.checked;

    saveValue(HABIT_KEY, habitsByDate);
    renderHabits();
  });
});


// ---------- FOCUS TIMER ----------

const timerDisplay = $("timer-display");
const timerStart = $("timer-start");
const timerStatus = $("timer-status");

const modes = {
  focus: 25 * 60,
  break: 5 * 60
};

let timerMode = "focus";
let remainingSeconds = modes.focus;
let timerInterval = null;
let timerRunning = false;

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  document.title = timerRunning
    ? `${timerDisplay.textContent} · MyPace`
    : "MyPace — Your life, in your rhythm.";
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = null;
  timerRunning = false;

  timerStart.textContent =
    timerMode === "focus" ? "Start focus" : "Start break";
}

function finishTimer() {
  stopTimer();

  timerStatus.textContent =
    timerMode === "focus"
      ? "Focus session complete. Take a little break."
      : "Break complete. Ready when you are.";

  timerStart.textContent =
    timerMode === "focus" ? "Start focus" : "Start break";

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(
      timerMode === "focus"
        ? "Focus session complete"
        : "Break complete",
      {
        body: "Check in with yourself before the next session."
      }
    );
  }
}

function selectTimerMode(mode) {
  stopTimer();

  timerMode = mode;
  remainingSeconds = modes[mode];

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.mode === mode
    );
  });

  timerStatus.textContent =
    mode === "focus"
      ? "Ready for a little focused time?"
      : "A short pause can help, too.";

  updateTimerDisplay();
}

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectTimerMode(button.dataset.mode);
  });
});

timerStart.addEventListener("click", async () => {
  if (timerRunning) {
    stopTimer();
    timerStatus.textContent =
      "Paused. Pick it up whenever you're ready.";
    updateTimerDisplay();
    return;
  }

  if (
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    try {
      await Notification.requestPermission();
    } catch {
      // Notifications are optional.
    }
  }

  timerRunning = true;
  timerStart.textContent = "Pause";

  timerStatus.textContent =
    timerMode === "focus"
      ? "One thing at a time. You've got this."
      : "Take a proper breather.";

  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      finishTimer();
    }
  }, 1000);
});

$("timer-reset").addEventListener("click", () => {
  stopTimer();

  remainingSeconds = modes[timerMode];

  timerStatus.textContent =
    "Timer reset. Ready when you are.";

  updateTimerDisplay();
});


// ---------- READING CORNER ----------

const bookThoughts = [
  {
    excerpt: '“I declare after all there is no enjoyment like reading!”',
    book: "Pride and Prejudice",
    author: "Jane Austen"
  },
  {
    excerpt: '“I am not afraid of storms, for I am learning how to sail my ship.”',
    book: "Little Women",
    author: "Louisa May Alcott"
  },
  {
    excerpt: '“There is no charm equal to tenderness of heart.”',
    book: "Emma",
    author: "Jane Austen"
  },
  {
    excerpt: '“Why, sometimes I’ve believed as many as six impossible things before breakfast.”',
    book: "Through the Looking-Glass",
    author: "Lewis Carroll"
  }
];

let thoughtIndex =
  Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000)
  % bookThoughts.length;

function showThought(index) {
  const thought = bookThoughts[index];

  $("book-excerpt").textContent = thought.excerpt;

  const book = document.createElement("strong");
  book.textContent = thought.book;

  const author = document.createElement("span");
  author.textContent = thought.author;

  $("book-source").replaceChildren(book, author);

  $("reading").classList.remove("is-changing");

  requestAnimationFrame(() => {
    $("reading").classList.add("is-changing");
  });
}

$("another-thought").addEventListener("click", () => {
  thoughtIndex = (thoughtIndex + 1) % bookThoughts.length;
  showThought(thoughtIndex);
});


// ---------- DATE, NAVIGATION & FIRST RENDER ----------

$("today-label").textContent =
  today.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

$("welcome-date").textContent =
  today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();

document.querySelectorAll('.sidebar .nav[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".sidebar .nav").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

renderTasks();
renderCalendar();
renderHabits();
updateTimerDisplay();
showThought(thoughtIndex);
