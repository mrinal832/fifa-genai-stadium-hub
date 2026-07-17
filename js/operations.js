/**
 * @fileoverview Operations Intelligence Module
 * @module operations
 */

'use strict';

/** Sample operational tasks */
const INITIAL_TASKS = [
  { id: 't1', title: 'Manage crowd flow at Gate D', assignee: 'Team Alpha', priority: 'urgent', status: 'urgent', location: 'Gate D' },
  { id: 't2', title: 'Restock first aid supplies — Medical Station 2', assignee: 'Team Delta', priority: 'high', status: 'pending', location: 'Section 312' },
  { id: 't3', title: 'Check HVAC Unit 7 — Level 3 North', assignee: 'Facilities', priority: 'high', status: 'pending', location: 'Level 3 North' },
  { id: 't4', title: 'Deploy extra stewards — North Concourse', assignee: 'Team Bravo', priority: 'urgent', status: 'urgent', location: 'North Concourse' },
  { id: 't5', title: 'Refill beer concession at Section 115', assignee: 'Catering', priority: 'normal', status: 'pending', location: 'Section 115' },
  { id: 't6', title: 'VIP lounge setup complete', assignee: 'Team Echo', priority: 'normal', status: 'done', location: 'VIP Level' },
  { id: 't7', title: 'PA system test completed', assignee: 'Tech Team', priority: 'normal', status: 'done', location: 'Control Room' },
];

/** Maintenance prediction data */
const MAINTENANCE_ITEMS = [
  { icon: '❄️', title: 'HVAC Unit 7 — Level 3 North', desc: '94% failure probability within 3 hours', urgency: 'urgent', urgencyLabel: '🔴 Urgent' },
  { icon: '💡', title: 'Lighting Bank 4 — East Stand', desc: 'Intermittent flickering detected — schedule inspection', urgency: 'high', urgencyLabel: '🟡 Today' },
  { icon: '🚿', title: 'Restroom C2 Sensor — Section 110', desc: 'Flow sensor offline — maintenance required', urgency: 'medium', urgencyLabel: '🟡 Soon' },
  { icon: '🔒', title: 'Gate B Emergency Lock — West Door', desc: 'Battery at 12% — replace before next event', urgency: 'high', urgencyLabel: '🟡 Today' },
  { icon: '📡', title: 'WiFi AP Node 34 — Section 225', desc: 'Degraded performance — 62% packet loss', urgency: 'medium', urgencyLabel: '🟢 Routine' },
];

let _taskFilter = 'all';
let _tasks = [...INITIAL_TASKS];

/**
 * Renders the operations task list.
 * @param {string} [filter='all'] - Filter key
 */
function renderTaskList(filter = 'all') {
  _taskFilter = filter;
  const list = getEl('task-list');
  if (!list) return;

  const filtered = filter === 'all' ? _tasks : _tasks.filter(t => t.status === filter || t.priority === filter);

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;padding:1rem 0">No tasks in this category.</p>';
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.id = `task-${task.id}`;
    div.setAttribute('role', 'listitem');
    div.innerHTML = `
      <div class="task-priority priority-${task.priority}" aria-hidden="true"></div>
      <div class="task-info">
        <div class="task-title">${sanitizeHTML(task.title)}</div>
        <div class="task-meta">${sanitizeHTML(task.assignee)} — ${sanitizeHTML(task.location)}</div>
      </div>
      <button class="task-status status-${task.status}" onclick="toggleTaskStatus('${task.id}')" aria-label="Mark task ${sanitizeHTML(task.title)} as ${task.status === 'done' ? 'pending' : 'done'}">
        ${task.status === 'done' ? '✅' : task.status === 'urgent' ? '🔴' : '🟡'}
      </button>`;
    list.appendChild(div);
  });
}

/**
 * Toggles a task between done and pending status.
 * @param {string} taskId
 */
function toggleTaskStatus(taskId) {
  const task = _tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = task.status === 'done' ? 'pending' : 'done';
  renderTaskList(_taskFilter);
  announceToScreenReader(`Task "${task.title}" marked as ${task.status}.`);
}

/**
 * Filters task list.
 * @param {string} filter
 */
function filterTasks(filter) {
  _taskFilter = filter;
  renderTaskList(filter);

  // Update ARIA pressed state on filter buttons
  qsa('.filter-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent.toLowerCase() === 'all') ? 'true' : 'false');
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent.toLowerCase() === 'all'));
  });
}

/**
 * Uses AI to assign the next highest-priority task.
 */
async function aiAssignTask() {
  const btn = getEl('ai-assign-btn');
  if (btn) btn.disabled = true;

  const pendingTasks = _tasks.filter(t => t.status !== 'done');
  if (pendingTasks.length === 0) {
    showToast('✅ All tasks are completed!', 'success');
    if (btn) btn.disabled = false;
    return;
  }

  showLoading('AI optimizing task assignments...');

  try {
    const taskSummary = pendingTasks.map(t => `${t.priority}: ${t.title} at ${t.location}`).join(', ');
    const prompt = `Given these pending stadium operations tasks: ${taskSummary}. Recommend the optimal assignment order and which task should be addressed immediately, with reasoning.`;
    const response = await generateAIResponse(prompt, 'operations');

    showToast(`🤖 AI Assignment: ${response.substring(0, 80)}...`, 'info', 5000);
    announceToScreenReader('AI task assignment recommendation ready.');
  } catch (_) {
    showToast('⚠️ AI assignment temporarily unavailable', 'warning');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Handles incident form submission with AI triage.
 * @param {Event} e - Form submit event
 */
async function submitIncident(e) {
  e.preventDefault();

  const type = sanitizeInput(getEl('incident-type')?.value || '');
  const location = sanitizeInput(getEl('incident-location')?.value || '');
  const desc = sanitizeInput(getEl('incident-desc')?.value || '', 1000);
  const resultEl = getEl('incident-result');
  const btn = getEl('report-incident-btn');

  if (!type || !location) {
    showToast('⚠️ Please fill in incident type and location', 'warning');
    announceToScreenReader('Please fill in incident type and location before submitting.', 'assertive');
    return;
  }

  if (btn) btn.disabled = true;
  showLoading('AI triaging incident...');

  try {
    const prompt = `Incident report at FIFA WC 2026 stadium: Type: ${type}, Location: ${location}, Description: ${desc || 'Not provided'}. Provide: 1) Priority level, 2) Immediate actions (3 bullet points), 3) Teams to notify, 4) Estimated resolution time.`;
    const response = await generateAIResponse(prompt, 'operations');

    const priorityColor = type === 'medical' || type === 'fire' ? '#ff1744' : type === 'security' ? '#ff6d00' : '#ffd600';
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="result-heading" style="color:${priorityColor}">🚨 AI Triage Complete — Incident #${Date.now().toString().slice(-6)}</div>
        <div style="margin-bottom:0.5rem"><span class="tag tag-danger">📍 ${sanitizeHTML(location)}</span> <span class="tag tag-warning">🔖 ${sanitizeHTML(type)}</span></div>
        <div>${response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>`;
      resultEl.className = 'incident-result visible';
    }

    announceToScreenReader(`Incident reported at ${location}. AI triage complete.`, 'assertive');
    showToast('🚨 Incident reported and triaged by AI', 'warning', 5000);

    // Add to task list
    const newTask = {
      id: `inc-${Date.now()}`,
      title: `Incident: ${type} at ${location}`,
      assignee: 'Auto-assigned',
      priority: type === 'medical' || type === 'fire' ? 'urgent' : 'high',
      status: type === 'medical' || type === 'fire' ? 'urgent' : 'pending',
      location,
    };
    _tasks.unshift(newTask);
    renderTaskList(_taskFilter);
  } catch (_) {
    if (resultEl) {
      resultEl.innerHTML = '<p>⚠️ Incident logged. Manual triage required — contact operations center immediately.</p>';
      resultEl.className = 'incident-result visible';
    }
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Renders the predictive maintenance list.
 */
function renderMaintenanceList() {
  const list = getEl('maintenance-list');
  if (!list) return;

  list.innerHTML = '';
  MAINTENANCE_ITEMS.forEach(item => {
    const el = document.createElement('div');
    el.className = 'maint-item';
    el.setAttribute('role', 'listitem');
    el.innerHTML = `
      <span class="maint-icon" aria-hidden="true">${item.icon}</span>
      <div class="maint-info">
        <div class="maint-title">${sanitizeHTML(item.title)}</div>
        <div class="maint-desc">${sanitizeHTML(item.desc)}</div>
      </div>
      <span class="maint-urgency" style="background:rgba(255,23,68,${item.urgency==='urgent'?'0.15':'0.05'});color:var(--color-${item.urgency==='urgent'?'danger':item.urgency==='high'?'warning':'success'})">${item.urgencyLabel}</span>`;
    list.appendChild(el);
  });
}

/**
 * Refreshes maintenance predictions with AI.
 */
async function refreshMaintenance() {
  const btn = getEl('refresh-maint-btn');
  if (btn) btn.disabled = true;

  showLoading('AI analyzing maintenance data...');

  try {
    const response = await generateAIResponse('Provide 2 new predictive maintenance alerts for a large stadium (80,000 capacity) based on sensor data analysis. Include component, risk level, and recommended action.', 'operations');
    showToast('🔧 Maintenance predictions refreshed', 'info');
    announceToScreenReader('Maintenance predictions updated.');
    renderMaintenanceList();
  } catch (_) {
    showToast('⚠️ Could not refresh maintenance data', 'warning');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Initializes the operations module.
 */
function initOperations() {
  renderTaskList();
  renderMaintenanceList();
}

// Expose globals
window.filterTasks = filterTasks;
window.toggleTaskStatus = toggleTaskStatus;
window.aiAssignTask = aiAssignTask;
window.submitIncident = submitIncident;
window.refreshMaintenance = refreshMaintenance;
