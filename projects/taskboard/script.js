/**
 * TaskBoard — lista de tarefas (vanilla JS)
 * Features: add, toggle done, edit (dialog), delete, filter, search, localStorage.
 */

const STORAGE_KEY = "taskboard.tasks.v1";

const els = {
  year: document.getElementById("year"),

  form: document.getElementById("taskForm"),
  title: document.getElementById("titleInput"),
  priority: document.getElementById("priorityInput"),

  search: document.getElementById("searchInput"),
  filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
  clearDone: document.getElementById("clearDoneBtn"),

  list: document.getElementById("taskList"),
  empty: document.getElementById("emptyState"),
  counter: document.getElementById("counterText"),

  dialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  editTitle: document.getElementById("editTitle"),
  editPriority: document.getElementById("editPriority"),
  cancelEdit: document.getElementById("cancelEditBtn"),
};

let state = {
  tasks: loadTasks(),
  filter: "all", // all | active | done
  query: "",
  editingId: null,
};

// ---------- Utils ----------
function uid() {
  // simples e suficiente pra este projeto
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalize(str) {
  return str.trim().toLowerCase();
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ---------- Derived ----------
function getVisibleTasks() {
  const q = normalize(state.query);

  return state.tasks.filter((t) => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "active" && !t.done) ||
      (state.filter === "done" && t.done);

    const matchesQuery = q.length === 0 || normalize(t.title).includes(q);

    return matchesFilter && matchesQuery;
  });
}

// ---------- Render ----------
function render() {
  if (els.year) els.year.textContent = new Date().getFullYear();

  const visible = getVisibleTasks();

  els.list.innerHTML = "";

  // Empty state
  els.empty.hidden = visible.length !== 0;

  // Counter (considera filtro e busca)
  els.counter.textContent =
    visible.length === 1 ? "1 tarefa" : `${visible.length} tarefas`;

  for (const task of visible) {
    els.list.appendChild(renderTask(task));
  }
}

function renderTask(task) {
  const li = document.createElement("li");
  li.className = `task${task.done ? " done" : ""}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.ariaLabel = `Marcar tarefa como ${
    task.done ? "não concluída" : "concluída"
  }`;

  checkbox.addEventListener("change", () => toggleTask(task.id));

  const titleWrap = document.createElement("div");
  titleWrap.className = "task-title";

  const title = document.createElement("strong");
  title.textContent = task.title;

  const meta = document.createElement("small");
  meta.textContent = `${priorityLabel(task.priority)} • criada em ${formatDate(
    task.createdAt,
  )}`;

  const pill = document.createElement("span");
  pill.className = `pill ${task.priority}`;
  pill.textContent = priorityLabel(task.priority);

  // organize meta: pill first, then date
  meta.innerHTML = "";
  meta.appendChild(pill);
  meta.append(` • criada em ${formatDate(task.createdAt)}`);

  titleWrap.appendChild(title);
  titleWrap.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.textContent = "Editar";
  editBtn.addEventListener("click", () => openEdit(task.id));

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "icon-btn";
  delBtn.textContent = "Remover";
  delBtn.addEventListener("click", () => deleteTask(task.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(checkbox);
  li.appendChild(titleWrap);
  li.appendChild(actions);

  return li;
}

function priorityLabel(p) {
  if (p === "high") return "Alta";
  if (p === "low") return "Baixa";
  return "Média";
}

// ---------- Actions ----------
function addTask(title, priority) {
  const task = {
    id: uid(),
    title: title.trim(),
    priority,
    done: false,
    createdAt: Date.now(),
  };

  state.tasks.unshift(task);
  saveTasks(state.tasks);
  render();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  );
  saveTasks(state.tasks);
  render();
}

function deleteTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  const ok = confirm(`Remover a tarefa "${task.title}"?`);
  if (!ok) return;

  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveTasks(state.tasks);
  render();
}

function clearDone() {
  const hasDone = state.tasks.some((t) => t.done);
  if (!hasDone) return;

  const ok = confirm("Remover todas as tarefas concluídas?");
  if (!ok) return;

  state.tasks = state.tasks.filter((t) => !t.done);
  saveTasks(state.tasks);
  render();
}

function setFilter(filter) {
  state.filter = filter;

  for (const btn of els.filterButtons) {
    const pressed = btn.dataset.filter === filter;
    btn.setAttribute("aria-pressed", String(pressed));
  }

  render();
}

function setQuery(q) {
  state.query = q;
  render();
}

// ---------- Edit dialog ----------
function openEdit(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  state.editingId = id;
  els.editTitle.value = task.title;
  els.editPriority.value = task.priority;

  if (typeof els.dialog.showModal === "function") {
    els.dialog.showModal();
    els.editTitle.focus();
  } else {
    // fallback simples: se dialog não suportar, usa prompt
    const newTitle = prompt("Editar título:", task.title);
    if (newTitle && newTitle.trim().length >= 2) {
      updateTask(id, { title: newTitle.trim() });
    }
  }
}

function closeEdit() {
  state.editingId = null;
  if (els.dialog.open) els.dialog.close();
}

function updateTask(id, patch) {
  state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveTasks(state.tasks);
  render();
}

// ---------- Events ----------
els.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = els.title.value.trim();
  const priority = els.priority.value;

  if (title.length < 2) {
    els.title.focus();
    return;
  }

  addTask(title, priority);
  els.form.reset();
  els.priority.value = "medium";
  els.title.focus();
});

els.search.addEventListener("input", (e) => setQuery(e.target.value));

for (const btn of els.filterButtons) {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
}

els.clearDone.addEventListener("click", clearDone);

els.cancelEdit.addEventListener("click", closeEdit);

els.editForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = state.editingId;
  if (!id) return;

  const title = els.editTitle.value.trim();
  const priority = els.editPriority.value;

  if (title.length < 2) {
    els.editTitle.focus();
    return;
  }

  updateTask(id, { title, priority });
  closeEdit();
});

// Init
render();
