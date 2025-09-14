const STORAGE_KEY = "taskCheckerData";
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

const today = getDateString(new Date());
let selectedDate = today;

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderCalendar();
  renderTaskSection();
  renderCompletedSection();
});

// --- Utility functions ---
function getDateString(date) {
  let y = date.getFullYear();
  let m = ('0'+(date.getMonth()+1)).slice(-2);
  let d = ('0'+date.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}
function parseDate(dateStr) {
  let [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y, m-1, d);
}

// --- Header rendering ---
function renderHeader() {
  const headerDate = document.getElementById("header-date");
  headerDate.textContent = parseDate(selectedDate).toDateString();
}

// --- Calendar rendering with month navigation ---
function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";

  // Navigation container (outside grid)
  let navContainer = document.createElement("div");
  navContainer.className = "calendar-nav-container";

  let prevBtn = document.createElement("button");
  prevBtn.className = "calendar-nav-btn";
  prevBtn.textContent = "< Prev";
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    selectedDate = getDateString(new Date(currentYear, currentMonth, 1));
    renderCalendar();
    renderHeader();
    renderTaskSection();
    renderCompletedSection();
  };

  let monthYearLabel = document.createElement("div");
  monthYearLabel.className = "calendar-month-label";
  monthYearLabel.textContent = new Date(currentYear, currentMonth).toLocaleString('default', {month: 'long', year: 'numeric'});

  let nextBtn = document.createElement("button");
  nextBtn.className = "calendar-nav-btn";
  nextBtn.textContent = "Next >";
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    selectedDate = getDateString(new Date(currentYear, currentMonth, 1));
    renderCalendar();
    renderHeader();
    renderTaskSection();
    renderCompletedSection();
  };

  navContainer.appendChild(prevBtn);
  navContainer.appendChild(monthYearLabel);
  navContainer.appendChild(nextBtn);
  calendarEl.appendChild(navContainer);

  // Calendar grid container (separate element)
  let calendarGrid = document.createElement("div");
  calendarGrid.className = "calendar-grid";

  // Day labels
  const firstDate = new Date(currentYear, currentMonth, 1);
  const lastDate = new Date(currentYear, currentMonth + 1, 0);
  let dayLabels = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  dayLabels.forEach(label => {
    let labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.className = "calendar-label";
    calendarGrid.appendChild(labelEl);
  });

  // Empty slots
  for(let i = 0; i < firstDate.getDay(); i++) {
    let emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day";
    emptyCell.innerHTML = "";
    calendarGrid.appendChild(emptyCell);
  }

  // Days of month
  for(let d = 1; d <= lastDate.getDate(); d++) {
    let dayDate = new Date(currentYear, currentMonth, d);
    let dayStr = getDateString(dayDate);
    let dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = d;

    if(dayStr === today) dayEl.classList.add("today");
    if(dayStr === selectedDate) dayEl.classList.add("selected");
    if(appData[dayStr] && appData[dayStr].tasks.length > 0) dayEl.classList.add("has-tasks");

    dayEl.onclick = () => {
      selectedDate = dayStr;
      renderHeader();
      renderCalendar();
      renderTaskSection();
      renderCompletedSection();
    };

    calendarGrid.appendChild(dayEl);
  }

  calendarEl.appendChild(calendarGrid);
}

// --- Render tasks for selected date ---
function renderTaskSection() {
  document.getElementById("tasks-headline").textContent =
    selectedDate === today ? "Today's Tasks" : `Tasks for ${parseDate(selectedDate).toDateString()}`;

  document.getElementById("task-input").value = "";
  let taskListEl = document.getElementById("task-list");
  taskListEl.innerHTML = "";
  let tasks = (appData[selectedDate]?.tasks) || [];

  tasks.forEach((taskObj, i) => {
    let li = document.createElement("li");
    let label = document.createElement("label");
    label.textContent = taskObj.text;
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";

    checkbox.onchange = () => {
      markTaskCompleted(selectedDate, i);
    };

    li.appendChild(checkbox);
    li.appendChild(label);
    taskListEl.appendChild(li);
  });

  document.getElementById("task-form").onsubmit = e => {
    e.preventDefault();
    let val = document.getElementById("task-input").value.trim();
    if(val) addTask(selectedDate, val);
    document.getElementById("task-input").value = "";
  };

  let completedCount = (appData[selectedDate]?.completed?.length) || 0;
  document.getElementById("completed-summary").textContent =
    completedCount > 0 ? `Completed: ${completedCount}` : "";
}

// --- Add new task action ---
function addTask(date, text) {
  if(!appData[date]) appData[date] = {tasks:[], completed: []};
  appData[date].tasks.push({text});
  saveData();
  renderTaskSection();
  renderCalendar();
}

// --- Mark task completed, move to completed list ---
function markTaskCompleted(date, idx) {
  let task = appData[date].tasks.splice(idx, 1)[0];
  appData[date].completed.push(task);
  saveData();
  renderTaskSection();
  renderCompletedSection();
  renderCalendar();
}

// --- Render completed tasks for selected date ---
function renderCompletedSection() {
  let completedListEl = document.getElementById("completed-list");
  completedListEl.innerHTML = "";
  let completed = (appData[selectedDate]?.completed) || [];
  completed.forEach(taskObj => {
    let li = document.createElement("li");
    li.textContent = taskObj.text;
    completedListEl.appendChild(li);
  });
}

// --- Save to localStorage ---
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}
