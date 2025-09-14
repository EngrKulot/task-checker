const STORAGE_KEY = "taskCheckerData";
const UNDO_KEY = "taskCheckerUndo";
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let undoData = JSON.parse(localStorage.getItem(UNDO_KEY)) || null;
const today = getDateString(new Date());
let selectedDate = today;
let undoTimeout = null; // Store timeout ID
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editingTaskIndex = -1; // Track which task is being edited

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

// --- Auto-hide undo functionality ---
function scheduleUndoHide() {
  // Clear existing timeout if any
  if (undoTimeout) {
    clearTimeout(undoTimeout);
  }
  
  // Set new timeout to hide after 5 seconds
  undoTimeout = setTimeout(() => {
    clearUndo();
  }, 5000); // 5000ms = 5 seconds
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
      editingTaskIndex = -1; // Cancel any editing when switching dates
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
  
  // Add undo button if there's undo data
  if (undoData) {
    let undoContainer = document.createElement("div");
    undoContainer.className = "undo-container";
    
    let undoBtn = document.createElement("button");
    undoBtn.className = "undo-btn";
    undoBtn.textContent = `↶ Undo ${undoData.action}`;
    undoBtn.onclick = performUndo;
    
    let dismissBtn = document.createElement("button");
    dismissBtn.className = "dismiss-btn";
    dismissBtn.textContent = "×";
    dismissBtn.onclick = clearUndo;
    
    undoContainer.appendChild(undoBtn);
    undoContainer.appendChild(dismissBtn);
    taskListEl.appendChild(undoContainer);
  }
  
  tasks.forEach((taskObj, i) => {
    let li = document.createElement("li");
    li.className = "task-item";
    
    // If this task is being edited
    if (editingTaskIndex === i) {
      let editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = taskObj.text;
      editInput.onblur = () => cancelEdit();
      editInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          saveEdit(selectedDate, i, editInput.value.trim());
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      };
      
      let saveBtn = document.createElement("button");
      saveBtn.className = "save-btn";
      saveBtn.textContent = "✓";
      saveBtn.onclick = () => saveEdit(selectedDate, i, editInput.value.trim());
      
      let cancelBtn = document.createElement("button");
      cancelBtn.className = "cancel-btn";
      cancelBtn.textContent = "×";
      cancelBtn.onclick = cancelEdit;
      
      li.appendChild(editInput);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      
      // Focus the input after rendering
      setTimeout(() => editInput.focus(), 10);
    } else {
      // Normal view
      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.onchange = () => {
        markTaskCompleted(selectedDate, i);
      };
      
      let label = document.createElement("label");
      label.textContent = taskObj.text;
      label.onclick = () => startEdit(i);
      
      let actionsDiv = document.createElement("div");
      actionsDiv.className = "task-actions";
      
      let editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "✎";
      editBtn.onclick = (e) => {
        e.stopPropagation();
        startEdit(i);
      };
      
      let deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "🗑";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTask(selectedDate, i);
      };
      
      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
      
      li.appendChild(checkbox);
      li.appendChild(label);
      li.appendChild(actionsDiv);
    }
    
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

// --- Edit task functions ---
function startEdit(index) {
  editingTaskIndex = index;
  renderTaskSection();
}

function saveEdit(date, index, newText) {
  if (newText && newText !== appData[date].tasks[index].text) {
    // Store undo data
    storeUndo({
      action: "edit",
      date: date,
      taskIndex: index,
      oldText: appData[date].tasks[index].text,
      newText: newText
    });
    
    appData[date].tasks[index].text = newText;
    saveData();
  }
  editingTaskIndex = -1;
  renderTaskSection();
}

function cancelEdit() {
  editingTaskIndex = -1;
  renderTaskSection();
}

// --- Delete task function ---
function deleteTask(date, index) {
  let deletedTask = appData[date].tasks[index];
  
  // Store undo data
  storeUndo({
    action: "delete",
    date: date,
    taskIndex: index,
    task: deletedTask
  });
  
  appData[date].tasks.splice(index, 1);
  saveData();
  renderTaskSection();
  renderCalendar();
}

// --- Mark task completed, move to completed list ---
function markTaskCompleted(date, idx) {
  let task = appData[date].tasks.splice(idx, 1)[0];
  
  // Store undo data
  storeUndo({
    action: "complete",
    date: date,
    taskIndex: idx,
    task: task
  });
  
  appData[date].completed.push(task);
  saveData();
  renderTaskSection();
  renderCompletedSection();
  renderCalendar();
}

// --- Modified Undo functionality with auto-hide ---
function storeUndo(undoAction) {
  undoData = undoAction;
  localStorage.setItem(UNDO_KEY, JSON.stringify(undoData));
  renderTaskSection(); // Re-render to show undo button
  scheduleUndoHide(); // Start the auto-hide timer
}

function performUndo() {
  if (!undoData) return;
  
  let date = undoData.date;
  if (!appData[date]) appData[date] = {tasks: [], completed: []};
  
  switch (undoData.action) {
    case "delete":
      // Re-insert deleted task
      appData[date].tasks.splice(undoData.taskIndex, 0, undoData.task);
      break;
      
    case "complete":
      // Move task back from completed to tasks
      let completedTask = appData[date].completed.pop();
      appData[date].tasks.splice(undoData.taskIndex, 0, undoData.task);
      break;
      
    case "edit":
      // Restore old text
      appData[date].tasks[undoData.taskIndex].text = undoData.oldText;
      break;
  }
  
  // Clear timeout when undo is performed
  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }
  
  clearUndo();
  saveData();
  renderTaskSection();
  renderCompletedSection();
  renderCalendar();
}

function clearUndo() {
  undoData = null;
  localStorage.removeItem(UNDO_KEY);
  
  // Clear the timeout when manually dismissed
  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }
  
  renderTaskSection();
}

// --- Render completed tasks for selected date ---
function renderCompletedSection() {
  let completedListEl = document.getElementById("completed-list");
  completedListEl.innerHTML = "";
  let completed = (appData[selectedDate]?.completed) || [];
  
  completed.forEach((taskObj, index) => {
    let li = document.createElement("li");
    li.className = "completed-item";
    
    let textSpan = document.createElement("span");
    textSpan.textContent = taskObj.text;
    
    let restoreBtn = document.createElement("button");
    restoreBtn.className = "restore-btn";
    restoreBtn.textContent = "↶";
    restoreBtn.onclick = () => restoreTask(selectedDate, index);
    
    li.appendChild(textSpan);
    li.appendChild(restoreBtn);
    completedListEl.appendChild(li);
  });
}

// --- Restore completed task ---
function restoreTask(date, index) {
  let restoredTask = appData[date].completed.splice(index, 1)[0];
  appData[date].tasks.push(restoredTask);
  
  storeUndo({
    action: "restore",
    date: date,
    taskIndex: appData[date].tasks.length - 1,
    task: restoredTask
  });
  
  saveData();
  renderTaskSection();
  renderCompletedSection();
  renderCalendar();
}

// --- Save to localStorage ---
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}
