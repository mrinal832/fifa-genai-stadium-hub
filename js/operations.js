/**
 * @fileoverview Operations Intelligence Module — Task & Incident Management
 * @module operations
 * @description Provides AI-powered operational task assignment, incident triage,
 *              and predictive maintenance management for FIFA World Cup 2026
 *              stadium operations staff and volunteers.
 */

'use strict';

/* -------- Constants -------- */

/**
 * @const {string[]} HIGH_PRIORITY_INCIDENT_TYPES
 * Incident types that receive urgent priority classification.
 */
const HIGH_PRIORITY_INCIDENT_TYPES = ['medical', 'fire'];

/* -------- Type Definitions -------- */

/**
 * @typedef {Object} Task
 * @property {string} id       - Unique task identifier
 * @property {string} title    - Task description
 * @property {string} assignee - Assigned team or individual
 * @property {'urgent'|'high'|'normal'} priority - Priority level
 * @property {'urgent'|'pending'|'done'} status   - Current status
 * @property {string} location - Physical location within the venue
 */

/**
 * @typedef {Object} MaintenanceItem
 * @property {string} icon         - Emoji icon for the component
 * @property {string} title        - Component name and location
 * @property {string} desc         - Maintenance description and risk
 * @property {string} urgency      - Urgency key: 'urgent'|'high'|'medium'
 * @property {string} urgencyLabel - Human-readable urgency label
 */

/* -------- Data -------- */

/** @type {Task[]} Initial operational task list */
const INITIAL_TASKS = [
  { id: 't1', title: 'Manage crowd flow at Gate D',              assignee: 'Team Alpha', priority: 'urgent', status: 'urgent',  location: 'Gate D'         },
  { id: 't2', title: 'Restock first aid — Medical Station 2',   assignee: 'Team Delta', priority: 'high',   status: 'pending', location: 'Section 312'    },
  { id: 't3', title: 'Inspect HVAC Unit 7 — Level 3 North',     assignee: 'Facilities', priority: 'high',   status: 'pending', location: 'Level 3 North'  },
  { id: 't4', title: 'Deploy extra stewards — North Concourse', assignee: 'Team Bravo', priority: 'urgent', status: 'urgent',  location: 'North Concourse'},
  { id: 't5', title: 'Refill concessions — Section 115',        assignee: 'Catering',   priority: 'normal', status: 'pending', location: 'Section 115'    },
  { id: 't6', title: 'VIP lounge setup complete',               assignee: 'Team Echo',  priority: 'normal', status: 'done',    location: 'VIP Level'      },
  { id: 't7', title: 'PA system test completed',                assignee: 'Tech Team',  priority: 'normal', status: 'done',    location: 'Control Room'   },
];

/** @type {MaintenanceItem[]} Predictive maintenance items */
const MAINTENANCE_ITEMS = [
  { icon: '❄️', title: 'HVAC Unit 7 — Level 3 North',        desc: '94% failure probability within 3 hours',           urgency: 'urgent', urgencyLabel: '🔴 Urgent'  },
  { icon: '💡', title: 'Lighting Bank 4 — East Stand',        desc: 'Intermittent flickering — schedule inspection',    urgency: 'high',   urgencyLabel: '🟡 Today'   },
  { icon: '🚿', title: 'Restroom Sensor C2 — Section 110',   desc: 'Flow sensor offline — maintenance required',       urgency: 'medium', urgencyLabel: '🟡 Soon'    },
  { icon: '🔒', title: 'Emergency Lock — Gate B West Door',   desc: 'Battery at 12% — replace before next event',      urgency: 'high',   urgencyLabel: '🟡 Today'   },
  { icon: '📡', title: 'WiFi AP Node 34 — Section 225',       desc: 'Degraded performance — 62% packet loss detected',  urgency: 'medium', urgencyLabel: '🟢 Routine' },
];

/* -------- Module State -------- */

/** @type {string} Active filter key for the task list */
let _taskFilter = 'all';

/** @type {Task[]} Mutable working copy of the task list */
let _tasks = [...INITIAL_TASKS];

/* -------- Private Helpers -------- */

/**
 * Returns the priority label for a task's current status.
 * @param {'urgent'|'pending'|'done'} status - Task status
 * @returns {string} Emoji status indicator
 */
function _statusIcon(status) {
  if (status === 'done')   return '✅';
  if (status === 'urgent') return '🔴';
  return '🟡';
}

/**
 * Determines whether a task matches the active filter.
 * @param {Task}   task   - Task to test
 * @param {string} filter - Active filter key
 * @returns {boolean} True if the task should be shown
 */
function _taskMatchesFilter(task, filter) {
  if (filter === 'all') return true;
  return task.status === filter || task.priority === filter;
}

/**
 * Returns the CSS colour for an incident priority heading.
 * @param {string} incidentType - Incident type string
 * @returns {string} CSS colour value
 */
function _incidentColour(incidentType) {
  if (HIGH_PRIORITY_INCIDENT_TYPES.includes(incidentType)) return '#ff1744';
  if (incidentType === 'security') return '#ff6d00';
  return '#ffd600';
}

/* -------- Public API -------- */

/**
 * Renders the filtered operations task list.
 * @param {string} [filter='all'] - Filter key: 'all'|'urgent'|'pending'|'done'
 */
function renderTaskList(filter = 'all') {
  _taskFilter = filter;
  const list = getEl('task-list');
  if (!list) return;

  const filtered = _tasks.filter(t => _taskMatchesFilter(t, filter));

  list.innerHTML = '';

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'empty-task-msg';
    emptyMsg.textContent = 'No tasks in this category.';
    list.appendChild(emptyMsg);
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.id = `task-${task.id}`;
    div.setAttribute('role', 'listitem');

    const priorityBar = document.createElement('div');
    priorityBar.className = `task-priority priority-${task.priority}`;
    priorityBar.setAttribute('aria-hidden', 'true');

    const info = document.createElement('div');
    info.className = 'task-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;

    const metaEl = document.createElement('div');
    metaEl.className = 'task-meta';
    metaEl.textContent = `${task.assignee} — ${task.location}`;

    info.appendChild(titleEl);
    info.appendChild(metaEl);

    const btn = document.createElement('button');
    btn.className = `task-status status-${task.status}`;
    btn.setAttribute('aria-label', `Mark "${task.title}" as ${task.status === 'done' ? 'pending' : 'done'}`);
    btn.textContent = _statusIcon(task.status);
    btn.addEventListener('click', () => toggleTaskStatus(task.id));

    div.appendChild(priorityBar);
    div.appendChild(info);
    div.appendChild(btn);
    list.appendChild(div);
  });
}

/**
 * Toggles a task between 'done' and 'pending' status.
 * @param {string} taskId - The ID of the task to toggle
 */
function toggleTaskStatus(taskId) {
  const task = _tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = task.status === 'done' ? 'pending' : 'done';
  renderTaskList(_taskFilter);
  announceToScreenReader(`Task "${task.title}" marked as ${task.status}.`);
}

/**
 * Filters the task list and updates ARIA pressed states on filter buttons.
 * @param {string} filter - Filter key: 'all'|'urgent'|'pending'|'done'|'normal'
 */
function filterTasks(filter) {
  _taskFilter = filter;
  renderTaskList(filter);

  qsa('.filter-btn').forEach(btn => {
    const matches = btn.dataset.filter === filter;
    btn.setAttribute('aria-pressed', String(matches));
    btn.classList.toggle('active', matches);
  });
}

/**
 * Uses AI to recommend the optimal task assignment order for pending tasks.
 * @returns {Promise<void>}
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
    const taskSummary = pendingTasks
      .map(t => `${t.priority}: ${t.title} at ${t.location}`)
      .join('; ');

    const prompt = `Stadium operations at FIFA WC 2026. Pending tasks: ${taskSummary}. Recommend the optimal assignment order and immediate priority action with reasoning.`;
    const response = await generateAIResponse(prompt, 'operations');

    showToast(`🤖 AI: ${response.substring(0, 80)}…`, 'info', 5000);
    announceToScreenReader('AI task assignment recommendation ready.');
  } catch (_err) {
    showToast('⚠️ AI assignment temporarily unavailable', 'warning');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Handles incident form submission with AI triage analysis.
 * On success, adds a new task to the task list automatically.
 * @param {Event} e - Form submit event
 * @returns {Promise<void>}
 */
async function submitIncident(e) {
  e.preventDefault();

  const type     = sanitizeInput(getEl('incident-type')?.value     || '');
  const location = sanitizeInput(getEl('incident-location')?.value || '');
  const desc     = sanitizeInput(getEl('incident-desc')?.value     || '', 1000);
  const resultEl = getEl('incident-result');
  const btn      = getEl('report-incident-btn');

  if (!type || !location) {
    showToast('⚠️ Please fill in incident type and location', 'warning');
    announceToScreenReader('Please fill in incident type and location before submitting.', 'assertive');
    return;
  }

  if (btn) btn.disabled = true;
  showLoading('AI triaging incident...');

  try {
    const prompt = [
      `Incident at FIFA WC 2026 stadium:`,
      `Type: ${type},`,
      `Location: ${location},`,
      `Description: ${desc || 'Not provided'}.`,
      `Provide: 1) Priority level, 2) Immediate actions (3 bullets), 3) Teams to notify, 4) Estimated resolution time.`,
    ].join(' ');

    const response      = await generateAIResponse(prompt, 'operations');
    const incidentId    = Date.now().toString().slice(-6);
    const priorityColor = _incidentColour(type);

    if (resultEl) {
      const heading = document.createElement('div');
      heading.className = 'result-heading';
      heading.style.color = priorityColor;
      heading.textContent = `🚨 AI Triage Complete — Incident #${incidentId}`;

      const tags = document.createElement('div');
      tags.style.marginBottom = '0.5rem';

      const locTag = document.createElement('span');
      locTag.className = 'tag tag-danger';
      locTag.textContent = `📍 ${location}`;

      const typeTag = document.createElement('span');
      typeTag.className = 'tag tag-warning';
      typeTag.textContent = `🔖 ${type}`;

      tags.appendChild(locTag);
      tags.appendChild(document.createTextNode(' '));
      tags.appendChild(typeTag);

      const responseEl = document.createElement('div');
      responseEl.innerHTML = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      resultEl.innerHTML = '';
      resultEl.appendChild(heading);
      resultEl.appendChild(tags);
      resultEl.appendChild(responseEl);
      resultEl.className = 'incident-result visible';
    }

    announceToScreenReader(`Incident at ${location} reported. AI triage complete.`, 'assertive');
    showToast('🚨 Incident reported and triaged by AI', 'warning', 5000);

    /** @type {Task} */
    const newTask = {
      id:       `inc-${Date.now()}`,
      title:    `Incident: ${type} at ${location}`,
      assignee: 'Auto-assigned',
      priority: HIGH_PRIORITY_INCIDENT_TYPES.includes(type) ? 'urgent' : 'high',
      status:   HIGH_PRIORITY_INCIDENT_TYPES.includes(type) ? 'urgent' : 'pending',
      location,
    };

    _tasks.unshift(newTask);
    renderTaskList(_taskFilter);
  } catch (_err) {
    if (resultEl) {
      resultEl.textContent = '⚠️ Incident logged. Manual triage required — contact operations center.';
      resultEl.className = 'incident-result visible';
    }
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Renders the predictive maintenance items list.
 */
function renderMaintenanceList() {
  const list = getEl('maintenance-list');
  if (!list) return;

  list.innerHTML = '';

  MAINTENANCE_ITEMS.forEach(item => {
    const el = document.createElement('div');
    el.className = 'maint-item';
    el.setAttribute('role', 'listitem');

    const icon = document.createElement('span');
    icon.className = 'maint-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = item.icon;

    const info = document.createElement('div');
    info.className = 'maint-info';

    const title = document.createElement('div');
    title.className = 'maint-title';
    title.textContent = item.title;

    const desc = document.createElement('div');
    desc.className = 'maint-desc';
    desc.textContent = item.desc;

    info.appendChild(title);
    info.appendChild(desc);

    const urgencyEl = document.createElement('span');
    urgencyEl.className = `maint-urgency urgency-${item.urgency}`;
    urgencyEl.textContent = item.urgencyLabel;

    el.appendChild(icon);
    el.appendChild(info);
    el.appendChild(urgencyEl);
    list.appendChild(el);
  });
}

/**
 * Refreshes maintenance predictions using AI analysis.
 * @returns {Promise<void>}
 */
async function refreshMaintenance() {
  const btn = getEl('refresh-maint-btn');
  if (btn) btn.disabled = true;

  showLoading('AI analyzing maintenance data...');

  try {
    const prompt = [
      'Provide 2 predictive maintenance alerts for a large FIFA WC 2026 stadium',
      '(82,500 capacity) based on sensor data. For each: component name, risk level,',
      'and recommended action.',
    ].join(' ');

    await generateAIResponse(prompt, 'operations');
    showToast('🔧 Maintenance predictions refreshed', 'info');
    announceToScreenReader('Maintenance predictions updated.');
    renderMaintenanceList();
  } catch (_err) {
    showToast('⚠️ Could not refresh maintenance data', 'warning');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Initializes the operations intelligence module.
 */
function initOperations() {
  renderTaskList();
  renderMaintenanceList();
}

/* -------- Global Exports -------- */
window.filterTasks       = filterTasks;
window.toggleTaskStatus  = toggleTaskStatus;
window.aiAssignTask      = aiAssignTask;
window.submitIncident    = submitIncident;
window.refreshMaintenance = refreshMaintenance;
