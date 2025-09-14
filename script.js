const STORAGE_KEY = "taskCheckerData";
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

const today = getDateString(new Date());
let selectedDate = today;

// New variables to track displayed calendar month and year
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderCalendar();
  renderTaskSection();
  renderCompletedSection();
});

// --- Utility ---
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

// --- Header ---
function renderHeader() {
  const headerDate = document.getElementById("header-date");
  headerDate.textContent = parseDate(selectedDate).toDateString();
}

// --- Calendar ---
function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";

  // Add month navigation buttons
  let navContainer = document.createElement("div");
  navContainer.style.display = "flex";
  navContainer.style.justifyContent = "space-between";
  navContainer.style.marginBottom = "10px";

  let prevBtn = document.createElement("button");
  prevBtn.textContent = "< Prev";
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  };

  let nextBtn = document.createElement("button");
  nextBtn.textContent = "Next >";
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  };

  let monthYearLabel = document.createElement("div");
  monthYearLabel.textContent = new Date(currentYear, currentMonth).toLocaleString('default', {month: 'long', year: 'numeric'});
  monthYearLabel.style.color = "#42a6fa";
  monthYearLabel.style.fontWeight = "600";
  monthYearLabel.style.alignSelf = "center";

  navContainer.appendChild(prevBtn);
  navContainer.appendChild(monthYearLabel);
  navContainer.appendChild(nextBtn);
  calendarEl.appendChild(navContainer);

  // Build calendar grid
  const firstDate = new Date(currentYear, currentMonth, 1);
  const lastDate = new Date(currentYear, currentMonth + 1, 0);
  let labels = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  labels.forEach(l => {
    let lab = document.createElement("div");
    lab.textContent = l;
    lab.className = "calendar-label";
    calendarEl.appendChild(lab);
  });
  // Empty leading days
  for(let i=0; i<firstDate.getDay(); i++){
    let empty = document.createElement("div");
    empty.className = "calendar-day";
    empty.innerHTML = "";
    calendarEl.appendChild(empty);
  }

  // Fill days
  for(let d=1; d <= lastDate.getDate(); d++){
    let dayDate = new Date(currentYear, currentMonth, d);
    let dayStr = getDateString(dayDate);
    let day = document.createElement("div");
    day.className = "calendar-day";
    day.textContent = d;

    if(dayStr === today) day.classList.add("today");
    if(dayStr === selectedDate) day.classList.add("selected");
    if(appData[dayStr] && appData[dayStr].tasks.length > 0) day.classList.add("has-tasks");

    day.onclick = () => {
      selectedDate = dayStr;
      renderHeader();
      renderCalendar();
      renderTaskSection();
      renderCompletedSection();
    };
    calendarEl.appendChild(day);
  }
}

// --- Tasks ---
function renderTaskSection() {
  document.getElementById("tasks-headline").textContent =
    selectedDate === today ? "Today's Tasks" : `Tasks for ${parseDate(selectedDate).toDateString()}`;

  document.getElementById("task-input").value = "";
  let ul = document.getElementById("task-list");
  ul.innerHTML = "";
  let tasks = (appData[selectedDate]?.tasks) || [];
  tasks.forEach((taskObj,i) => {
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
    ul.appendChild(li);
  });

  // Add form events
  document.getElementById("task-form").onsubmit = e => {
    e.preventDefault();
    let val = document.getElementById("task-input").value.trim();
    if(val) addTask(selectedDate, val);
    document.getElementById("task-input").value = "";
  };

  // Update completed tasks summary
  let completedCount = (appData[selectedDate]?.completed?.length) || 0;
  document.getElementById("completed-summary").textContent =
    completedCount > 0 ? `Completed: ${completedCount}` : "";
}

// --- Actions ---
function addTask(date,text) {
  if(!appData[date]) appData[date] = {tasks:[],completed:[]};
  appData[date].tasks.push({text});
  saveData();
  renderTaskSection();
  renderCalendar();
}

function markTaskCompleted(date, idx) {
  let t = appData[date].tasks.splice(idx,1)[0];
  appData[date].completed.push(t);
  saveData();
  renderTaskSection();
  renderCompletedSection();
  renderCalendar();
}

// --- Completed list ---
function renderCompletedSection() {
  let ul = document.getElementById("completed-list");
  ul.innerHTML = "";
  let completed = (appData[selectedDate]?.completed) || [];
  completed.forEach(taskObj => {
    let li = document.createElement("li");
    li.textContent = taskObj.text;
    ul.appendChild(li);
  });
}

// --- Persist ---
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}
