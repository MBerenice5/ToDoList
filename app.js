const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const categorySelect = document.getElementById("category-select");
const taskList = document.getElementById("task-list");
const deleteAllBtn = document.getElementById("delete-all");
const completeAllBtn = document.getElementById("complete-all");
const pendingCountEl = document.getElementById("pending-count");
const completedCountEl = document.getElementById("completed-count");
const taskTemplate = document.getElementById("task-template");
const modal = document.getElementById("task-modal");
const openModalBtn = document.getElementById("open-modal");
const closeModalBtn = document.getElementById("close-modal");
const cancelBtn = document.getElementById("cancel-btn");
const modalTitle = document.getElementById("modal-title");
const filterButtons = document.querySelectorAll(".filter-btn");
const texts = ["To do list", "You can do it!"];
const typingSpeed = 100;
const deletingSpeed = 60;
const delayBetween = 1500;
const typewriterEl = document.getElementById("typewriter");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingTaskId = null;
let currentTextIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const currentText = texts[currentTextIndex];

    if (isDeleting) {
        typewriterEl.textContent = currentText.substring(0, charIndex--);
        if (charIndex < 0) {
            isDeleting = false;
            currentTextIndex = (currentTextIndex + 1) % texts.length;
            setTimeout(type, 300);
            return;
        }
    } else {
        typewriterEl.textContent = currentText.substring(0, charIndex++);
        if (charIndex > currentText.length) {
            isDeleting = true;
            setTimeout(type, delayBetween);
            return;
        }
    }
    setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
}

type();

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
}

function openModal(editTask = null) {
    modal.setAttribute("aria-hidden", "false");
    if (editTask) {
        editingTaskId = editTask.id;
        modalTitle.textContent = "Editar tarea";
        taskInput.value = editTask.text;
        categorySelect.value = editTask.category;
    } else {
        editingTaskId = null;
        modalTitle.textContent = "Agregar nueva tarea";
        taskForm.reset();
        categorySelect.selectedIndex = 0;
        taskInput.value = "";
    }
    taskInput.focus();
}

function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    editingTaskId = null;
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

openModalBtn.addEventListener("click", () => openModal(null));
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const category = categorySelect.value;

    if (!text || !category) {
        alert("Por favor completa la tarea y la categoría.");
        return;
    }

    if (editingTaskId) {
        tasks = tasks.map(t => t.id === editingTaskId ? { ...t, text, category } : t);
    } else {
        const newTask = { id: Date.now().toString(), text, category, completed: false };
        tasks.unshift(newTask);
    }

    saveTasks();
    applyFilterFromURL();
    closeModal();
});

taskList.addEventListener("click", (e) => {
    const taskElem = e.target.closest(".task-card");
    if (!taskElem) return;
    const id = taskElem.dataset.id;

    if (e.target.closest(".delete-btn")) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        applyFilterFromURL();
        return;
    }

    if (e.target.closest(".edit-btn")) {
        const t = tasks.find(x => x.id === id);
        if (t) openModal(t);
        return;
    }

    if (e.target.classList.contains("task-checkbox")) {
        const checked = e.target.checked;
        tasks = tasks.map(t => t.id === id ? { ...t, completed: checked } : t);
        saveTasks();
        applyFilterFromURL();
    }
});

deleteAllBtn.addEventListener("click", () => {
    if (!confirm("¿Borrar todas las tareas?")) return;
    tasks = [];
    saveTasks();
    applyFilterFromURL();
});

completeAllBtn.addEventListener("click", () => {
    tasks = tasks.map(t => ({ ...t, completed: true }));
    saveTasks();
    applyFilterFromURL();
});

function setActiveFilterButton(category) {
    filterButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === (category || ""));
    });
}

function updateURLForFilter(category) {
    if (category) {
        const newUrl = `${window.location.pathname}?categoria=${encodeURIComponent(category)}`;
        window.history.pushState({ categoria: category }, "", newUrl);
    } else {
        window.history.pushState({}, "", window.location.pathname);
    }
}

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const cat = btn.dataset.category || "";
        const isActive = btn.classList.contains("active");
        const newFilter = isActive ? "" : cat;
        setActiveFilterButton(newFilter);
        updateURLForFilter(newFilter);
        applyFilterFromURL();
    });
});

window.addEventListener("popstate", () => {
    applyFilterFromURL();
});

function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("categoria") || "";
}

function applyFilterFromURL() {
    const category = getCategoryFromURL();
    setActiveFilterButton(category);
    const filtered = category ? tasks.filter(t => t.category === category) : tasks;
    renderTasks(filtered);
}

function renderTasks(list) {
    taskList.innerHTML = "";
    if (!list.length) {
        const empty = document.createElement("div");
        empty.textContent = "¡Agrega una tarea para empezar!";
        empty.style.display = "flex";
        empty.style.justifyContent = "center";
        taskList.appendChild(empty);
    }

    list.forEach(t => {
        const node = taskTemplate.content.cloneNode(true);
        const card = node.querySelector(".task-card");
        card.dataset.id = t.id;
        card.dataset.category = t.category;
        card.classList.toggle("completed", t.completed);

        node.querySelector(".task-text").textContent = t.text;
        node.querySelector(".task-category").textContent = t.category;
        node.querySelector(".task-checkbox").checked = !!t.completed;

        taskList.appendChild(node);
    });

    updateCounters();
}

function updateCounters() {
    const pending = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
}

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    applyFilterFromURL();
});