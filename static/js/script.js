
const KEY = "mypace.tasks.v1";

const list = document.getElementById("task-list");
const dialog = document.getElementById("task-dialog");
const form = document.getElementById("task-form");

let tasks = [];


// LOAD SAVED TASKS
try {
  tasks = JSON.parse(localStorage.getItem(KEY)) || [];
} catch {
  tasks = [];
}


// SAVE TASKS
function save() {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}


// DISPLAY TASKS
function render() {

  list.querySelectorAll(".task-row").forEach(row => row.remove());

  const empty = list.querySelector(".empty");

  if (empty) {
    empty.hidden = tasks.length > 0;
  }


  tasks.forEach(task => {

    const row = document.createElement("div");

    row.className = "task-row" + (task.completed ? " done" : "");


    // CHECKBOX
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


    // TASK INFORMATION
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

      if (value === "Important") {
        item.className = "task-priority";
      }

      meta.append(item);

    });


    main.append(title, meta);


    // DELETE BUTTON
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


  // UPDATE STATISTICS
  const done = tasks.filter(task => task.completed).length;


  document.getElementById("completed-count").textContent =
    `${String(done).padStart(2, "0")} / ${String(tasks.length).padStart(2, "0")}`;


  document.getElementById("priority-count").textContent =
    String(
      Math.min(
        3,
        tasks.filter(t => !t.completed && t.priority === "Important").length
      )
    ).padStart(2, "0");


  document.getElementById("task-summary").textContent =
    tasks.length
      ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} in your list`
      : "Your tasks will appear here.";


  document.getElementById("completion-caption").textContent =
    tasks.length
      ? `${done} of ${tasks.length} completed`
      : "Your day is still taking shape";

}



// OPEN ADD TASK DIALOG
document.getElementById("add-task-open").addEventListener("click", () => {

  form.reset();

  dialog.showModal();

  document.getElementById("task-title").focus();

});


// CLOSE DIALOG
function closeDialog() {
  dialog.close();
}

document.getElementById("dialog-close").addEventListener("click", closeDialog);

document.getElementById("dialog-cancel").addEventListener("click", closeDialog);



// ADD NEW TASK
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



// CLEAR COMPLETED TASKS
document.getElementById("clear-completed").addEventListener("click", () => {

  tasks = tasks.filter(task => !task.completed);

  save();

  render();

});



// DISPLAY TODAY'S DATE
const today = new Date();

document.getElementById("today-label").textContent =
  today.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });


document.getElementById("welcome-date").textContent =
  today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();



// INITIAL RENDER
render();



// READING CORNER
// Short excerpts from public-domain books.

const bookThoughts = [

  {
    excerpt: '“I declare after all there is no enjoyment like reading!”',
    book: 'Pride and Prejudice',
    author: 'Jane Austen'
  },

  {
    excerpt: '“I am not afraid of storms, for I am learning how to sail my ship.”',
    book: 'Little Women',
    author: 'Louisa May Alcott'
  },

  {
    excerpt: '“There is no charm equal to tenderness of heart.”',
    book: 'Emma',
    author: 'Jane Austen'
  },

  {
    excerpt: '“Why, sometimes I’ve believed as many as six impossible things before breakfast.”',
    book: 'Through the Looking-Glass',
    author: 'Lewis Carroll'
  }

];


const excerptElement = document.getElementById("book-excerpt");

const sourceElement = document.getElementById("book-source");

const anotherThoughtButton = document.getElementById("another-thought");

const readingCard = document.getElementById("reading");


// Select a thought based on the current date.
let thoughtIndex =
  Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000)
  % bookThoughts.length;



// DISPLAY A BOOK THOUGHT
function showThought(index) {

  const thought = bookThoughts[index];

  if (!thought || !excerptElement || !sourceElement) return;


  excerptElement.textContent = thought.excerpt;


  sourceElement.replaceChildren();


  const book = document.createElement("strong");

  book.textContent = thought.book;


  const author = document.createElement("span");

  author.textContent = thought.author;


  sourceElement.append(book, author);


  if (readingCard) {

    readingCard.classList.remove("is-changing");

    requestAnimationFrame(() => {
      readingCard.classList.add("is-changing");
    });

  }

}



// ANOTHER THOUGHT BUTTON
if (anotherThoughtButton) {

  anotherThoughtButton.addEventListener("click", () => {

    thoughtIndex = (thoughtIndex + 1) % bookThoughts.length;

    showThought(thoughtIndex);

  });

}


// SHOW INITIAL THOUGHT
showThought(thoughtIndex);



// SIDEBAR ACTIVE LINK
document.querySelectorAll('.sidebar .nav[href^="#"]').forEach(link => {

  link.addEventListener("click", () => {

    document.querySelectorAll(".sidebar .nav").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");

  });

});
