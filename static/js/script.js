const KEY = "mypace.tasks.v1";
const list = document.getElementById("task-list");
const dialog = document.getElementById("task-dialog");
const form = document.getElementById("task-form");
let tasks = [];

try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch { tasks = []; }

function save() {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

function render() {
  list.querySelectorAll(".task-row").forEach(row => row.remove());
  const empty = list.querySelector(".empty");
  if (empty) empty.hidden = tasks.length > 0;

  tasks.forEach(task => {
    const row = document.createElement("div");
    row.className = "task-row" + (task.completed ? " done" : "");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = task.completed;
    check.setAttribute("aria-label", "Mark task complete");
    check.addEventListener("change", () => {
      task.completed = check.checked;
      save();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    [task.category, task.duration, task.priority].forEach(value => {
      const item = document.createElement("span");
      item.textContent = value;
      if (value === "Important") item.className = "task-priority";
      meta.append(item);
    });
    main.append(title, meta);

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete task");
    remove.addEventListener("click", () => {
      tasks = tasks.filter(item => item.id !== task.id);
      save();
      render();
    });

    row.append(check, main, remove);
    list.append(row);
  });

  const done = tasks.filter(task => task.completed).length;
  document.getElementById("completed-count").textContent =
    `${String(done).padStart(2, "0")} / ${String(tasks.length).padStart(2, "0")}`;
  document.getElementById("priority-count").textContent =
    String(Math.min(3, tasks.filter(t => !t.completed && t.priority === "Important").length)).padStart(2, "0");
  document.getElementById("task-summary").textContent =
    tasks.length ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} in your list` : "Your tasks will appear here.";
  document.getElementById("completion-caption").textContent =
    tasks.length ? `${done} of ${tasks.length} completed` : "Your day is still taking shape";
}

document.getElementById("add-task-open").addEventListener("click", () => {
  form.reset();
  dialog.showModal();
  document.getElementById("task-title").focus();
});
function closeDialog() { dialog.close(); }
document.getElementById("dialog-close").addEventListener("click", closeDialog);
document.getElementById("dialog-cancel").addEventListener("click", closeDialog);

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const title = data.get("title").trim();
  if (!title) return;
  tasks.unshift({
    id: Date.now() + Math.random(),
    title,
    category: data.get("category"),
    priority: data.get("priority"),
    duration: data.get("duration"),
    completed: false
  });
  save();
  render();
  closeDialog();
});

document.getElementById("clear-completed").addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  save();
  render();
});

const today = new Date();
document.getElementById("today-label").textContent =
  today.toLocaleDateString(undefined, {weekday:"short", day:"numeric", month:"short"});
document.getElementById("welcome-date").textContent =
  today.toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"}).toUpperCase();
render();
