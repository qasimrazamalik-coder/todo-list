document.addEventListener("DOMContentLoaded", loadTasks);
const taskInput = document.getElementById('taskInput');
const taskNotes = document.getElementById('taskNotes');
const taskDate = document.getElementById('taskDate');
const taskPriority = document.getElementById('taskPriority');
const taskRepeat = document.getElementById('taskRepeat');
const taskList = document.getElementById('taskList');
const addBtn = document.getElementById('addBtn');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const streakDisplay = document.getElementById('streakDisplay');
let currentFilter = 'all';
let streak = 0;

addBtn.addEventListener('click', addTask);
themeToggle.addEventListener('click', toggleTheme);
exportBtn.addEventListener('click', exportTasks);

function addTask() {
    const text = taskInput.value.trim();
    const notes = taskNotes.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;
    const repeat = taskRepeat.value;
    if (!text) return alert('Enter a task!');
    createTaskElement(text, notes, date, priority, repeat);
    saveTask(text, notes, date, priority, repeat, false);
    taskInput.value = ''; taskNotes.value = ''; taskDate.value = ''; taskRepeat.value = 'none';
    applyFilter(); updateDashboard();
}

function createTaskElement(text, notes, date, priority, repeat, completed = false) {
    const li = document.createElement('li');
    li.classList.add(priority);
    if (completed) li.classList.add('completed');
    const taskSpan = document.createElement('span');
    taskSpan.innerHTML = `<strong>${text}</strong>${notes ? ' - ' + notes : ''}${date ? ' (' + date + ')' : ''}${repeat !== 'none' ? ' [Repeat:' + repeat + ']' : ''}`;

    const btnGroup = document.createElement('div'); btnGroup.classList.add('buttons');
    const completeBtn = document.createElement('button'); completeBtn.textContent = '✔'; completeBtn.classList.add('complete-btn');
    completeBtn.onclick = () => { li.classList.toggle('completed'); updateLocalStorage(); applyFilter(); animateTask(li); updateStreak(); updateDashboard(); };

    const editBtn = document.createElement('button'); editBtn.textContent = '✎'; editBtn.classList.add('edit-btn');
    editBtn.onclick = () => editTask(li, taskSpan);

    const deleteBtn = document.createElement('button'); deleteBtn.textContent = '🗑'; deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = () => { li.style.display = 'none'; updateLocalStorage(); updateDashboard(); };

    btnGroup.append(completeBtn, editBtn, deleteBtn);
    li.append(taskSpan, btnGroup);
    taskList.appendChild(li);
}

function editTask(li, span) {
    const newText = prompt('Edit task:', span.textContent);
    if (newText && newText.trim() !== '') { span.textContent = newText.trim(); updateLocalStorage(); }
}

function saveTask(text, notes, date, priority, repeat, completed) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ text, notes, date, priority, repeat, completed });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(t => createTaskElement(t.text, t.notes, t.date, t.priority, t.repeat, t.completed));
    applyFilter(); updateDashboard();
}

function updateLocalStorage() {
    const allTasks = [];
    document.querySelectorAll('#taskList li').forEach(li => {
        const span = li.querySelector('span');
        allTasks.push({ text: span.textContent, notes: '', date: '', priority: li.classList.contains('high') ? 'high' : li.classList.contains('medium') ? 'medium' : 'low', repeat: 'none', completed: li.classList.contains('completed') });
    });
    localStorage.setItem('tasks', JSON.stringify(allTasks));
}

function toggleTheme() { document.body.classList.toggle('light'); }

function filterTasks(type) { currentFilter = type; applyFilter(); }

function applyFilter() {
    document.querySelectorAll('#taskList li').forEach(li => {
        li.style.display = 'flex';
        if (currentFilter === 'completed' && !li.classList.contains('completed')) li.style.display = 'none';
        if (currentFilter === 'active' && li.classList.contains('completed')) li.style.display = 'none';
    });
}

function sortTasks(type) {
    const tasksArray = Array.from(taskList.children);
    tasksArray.sort((a, b) => {
        if (type === 'priority') {
            const prioVal = { 'high': 3, 'medium': 2, 'low': 1 };
            return prioVal[b.classList.contains('high') ? 'high' : b.classList.contains('medium') ? 'medium' : 'low'] - prioVal[a.classList.contains('high') ? 'high' : a.classList.contains('medium') ? 'medium' : 'low'];
        } else if (type === 'date') {
            const dateA = a.querySelector('span').textContent.match(/\((.*)\)/)?.[1] || '';
            const dateB = b.querySelector('span').textContent.match(/\((.*)\)/)?.[1] || '';
            return dateA.localeCompare(dateB);
        }
    });
    taskList.innerHTML = ''; tasksArray.forEach(li => taskList.appendChild(li));
}

function searchTasks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#taskList li').forEach(li => {
        const text = li.querySelector('span').textContent.toLowerCase();
        li.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

function animateTask(li) { li.style.transform = 'scale(1.05)'; setTimeout(() => li.style.transform = 'scale(1)', 200); }

function updateStreak() { streak++; streakDisplay.textContent = `🔥 Current Completion Streak: ${streak} days`; }

function updateDashboard() {
    const total = document.querySelectorAll('#taskList li').length;
    const completed = document.querySelectorAll('#taskList li.completed').length;
    const ctx = document.getElementById('taskChart').getContext('2d');
    if (window.taskChart) window.taskChart.destroy();
    window.taskChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Completed', 'Active'], datasets: [{ data: [completed, total - completed], backgroundColor: ['#69db7c', '#00e0ff'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
}

function exportTasks() {
    const tasks = Array.from(document.querySelectorAll('#taskList li')).map(li => li.querySelector('span').textContent);
    const blob = new Blob([tasks.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tasks.txt'; a.click();
}
