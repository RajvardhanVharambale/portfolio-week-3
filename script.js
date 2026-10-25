/* Week 3 Internship Project — JavaScript interactions
   Reusable helpers, event listeners, DOM manipulation, validation, and localStorage. */
"use strict";

const STORAGE_KEYS = {
  theme: "rv-portfolio-theme",
  tasks: "rv-portfolio-tasks"
};

function getElement(id) {
  return document.getElementById(id);
}

function setText(element, text) {
  if (element) element.textContent = text;
}

function readStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? fallback : storedValue;
  } catch (error) {
    console.warn("Local storage is unavailable in this browser.", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Could not save this preference in local storage.", error);
  }
}

/* Feature 1: Theme toggle + saved preference */
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  const icon = getElement("theme-icon");
  const label = getElement("theme-toggle");
  if (icon) icon.textContent = isDark ? "☀" : "☾";
  if (label) {
    label.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    const themeLabel = label.querySelector(".theme-label");
    if (themeLabel) themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  }
  writeStorage(STORAGE_KEYS.theme, theme);
}

function initThemeToggle() {
  const savedTheme = readStorage(STORAGE_KEYS.theme, "light");
  applyTheme(savedTheme === "dark" ? "dark" : "light");
  getElement("theme-toggle")?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

/* Feature 2: Mobile navigation */
function initMobileNavigation() {
  const toggle = getElement("menu-toggle");
  const links = getElement("nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  document.addEventListener("click", (event) => {
    if (!links.contains(event.target) && !toggle.contains(event.target)) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

/* Feature 3: Show/hide extra about content */
function initAboutReveal() {
  const button = getElement("about-toggle");
  const panel = getElement("about-extra");
  if (!button || !panel) return;

  button.addEventListener("click", () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
    const symbol = button.querySelector("span");
    if (symbol) symbol.textContent = willOpen ? "−" : "＋";
    const text = willOpen ? "Show less about me" : "A little more about me";
    button.childNodes[0].textContent = text + " ";
  });
}

/* Feature 4: Project slider */
function initProjectSlider() {
  const slides = Array.from(document.querySelectorAll(".project-card"));
  const previousButton = getElement("project-prev");
  const nextButton = getElement("project-next");
  const counter = getElement("slide-count");
  const dots = Array.from(document.querySelectorAll(".slider-dot"));
  if (!slides.length || !previousButton || !nextButton) return;

  let activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.hidden = !isActive;
      slide.classList.toggle("is-active", isActive);
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-current", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });
    setText(counter, `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`);
  }

  previousButton.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => showSlide(activeIndex + 1));
  dots.forEach((dot) => {
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.slide)));
  });
  showSlide(0);
}

/* Feature 5: To-do list with add, complete, remove, and persistence */
function loadTasks() {
  try {
    const parsed = JSON.parse(readStorage(STORAGE_KEYS.tasks, "[]"));
    return Array.isArray(parsed)
      ? parsed.filter((task) => task && typeof task.text === "string" && typeof task.completed === "boolean")
      : [];
  } catch (error) {
    console.warn("Saved tasks could not be read; starting with an empty list.", error);
    return [];
  }
}

function initTodoList() {
  const form = getElement("todo-form");
  const input = getElement("todo-input");
  const list = getElement("todo-list");
  const count = getElement("todo-count");
  const hint = getElement("todo-hint");
  const clearCompletedButton = getElement("clear-completed");
  if (!form || !input || !list) return;

  let tasks = loadTasks();

  function saveTasks() {
    writeStorage(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }

  function renderTasks() {
    list.replaceChildren();
    tasks.forEach((task, index) => {
      const item = document.createElement("li");
      item.className = `todo-item${task.completed ? " is-complete" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.id = `todo-task-${index}`;
      checkbox.setAttribute("aria-label", `Mark "${task.text}" as complete`);
      checkbox.addEventListener("change", () => {
        tasks[index].completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = task.text;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-task";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Remove task: ${task.text}`);
      removeButton.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
        setText(hint, "Task removed.");
      });

      item.append(checkbox, label, removeButton);
      list.append(item);
    });

    const remaining = tasks.filter((task) => !task.completed).length;
    setText(count, `${tasks.length} task${tasks.length === 1 ? "" : "s"} · ${remaining} remaining`);
    if (tasks.length === 0) setText(hint, "Start with one thing you want to get done.");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const taskText = input.value.trim();
    if (!taskText) {
      setText(hint, "Please type a task before adding it.");
      input.focus();
      return;
    }
    tasks.push({ text: taskText, completed: false });
    saveTasks();
    renderTasks();
    setText(hint, "Nice — one step added.");
    form.reset();
    input.focus();
  });

  clearCompletedButton?.addEventListener("click", () => {
    const originalLength = tasks.length;
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
    setText(hint, originalLength === tasks.length ? "There are no completed tasks to clear." : "Completed tasks cleared.");
  });

  renderTasks();
}

/* Feature 6: Contact form validation with inline and real-time feedback */
function showFieldError(field, message) {
  const errorElement = getElement(`${field.id}-error`);
  if (errorElement) setText(errorElement, message);
  field.setAttribute("aria-invalid", String(Boolean(message)));
}

function validateEmail(email) {
  // A practical format check for a front-end demo; server-side validation is also needed in production.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function validateContactField(field) {
  const value = field.value.trim();
  let message = "";

  if (field.required && !value) {
    message = "This field is required.";
  } else if (field.id === "name" && value.length < 2) {
    message = "Please enter at least 2 characters.";
  } else if (field.id === "email" && value && !validateEmail(value)) {
    message = "Please enter a valid email address.";
  } else if (field.id === "subject" && value.length < 3) {
    message = "Subject must be at least 3 characters.";
  } else if (field.id === "message" && value.length < 10) {
    message = "Message must be at least 10 characters.";
  }

  showFieldError(field, message);
  return message === "";
}

function initContactForm() {
  const form = getElement("contact-form");
  const feedback = getElement("form-feedback");
  const messageField = getElement("message");
  const messageCount = getElement("message-count");
  if (!form || !feedback) return;

  const fields = ["name", "email", "subject", "message"].map(getElement).filter(Boolean);

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateContactField(field));
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) validateContactField(field);
      feedback.textContent = "";
      feedback.className = "form-feedback";
    });
  });

  messageField?.addEventListener("input", () => {
    setText(messageCount, `${messageField.value.length} / 1000`);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const results = fields.map(validateContactField);
    const isValid = results.every(Boolean);

    if (!isValid) {
      feedback.textContent = "Please correct the highlighted fields and try again.";
      feedback.className = "form-feedback error";
      const firstInvalid = fields.find((field) => field.getAttribute("aria-invalid") === "true");
      firstInvalid?.focus();
      return;
    }

    // No backend is connected. This is a local demonstration, not an actual email send.
    feedback.textContent = "Validation successful! No MESSAGE was sent !";
    feedback.className = "form-feedback success";
    form.reset();
    fields.forEach((field) => showFieldError(field, ""));
    setText(messageCount, "0 / 1000");
  });
}

function initFooterYear() {
  setText(getElement("current-year"), String(new Date().getFullYear()));
}

function initPortfolio() {
  initThemeToggle();
  initMobileNavigation();
  initAboutReveal();
  initProjectSlider();
  initTodoList();
  initContactForm();
  initFooterYear();
  console.log("Week 3 portfolio JavaScript loaded successfully.");
}

document.addEventListener("DOMContentLoaded", initPortfolio);
