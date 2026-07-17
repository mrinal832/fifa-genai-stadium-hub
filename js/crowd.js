/**
 * @fileoverview Crowd Management Module
 * @module crowd
 */

'use strict';

/** Zone data structure for crowd management */
const CROWD_ZONES = [
  { id: 'A', name: 'North Stand', pct: 89, level: 'high' },
  { id: 'B', name: 'South Stand', pct: 45, level: 'low' },
  { id: 'C', name: 'East Upper', pct: 67, level: 'med' },
  { id: 'D', name: 'West Upper', pct: 72, level: 'med' },
  { id: 'E', name: 'Gate A Area', pct: 55, level: 'med' },
  { id: 'F', name: 'Gate B Area', pct: 31, level: 'low' },
  { id: 'G', name: 'Concourse N', pct: 93, level: 'critical' },
  { id: 'H', name: 'Fan Zone', pct: 62, level: 'med' },
  { id: 'I', name: 'Food Court A', pct: 78, level: 'high' },
  { id: 'J', name: 'Food Court B', pct: 25, level: 'low' },
  { id: 'K', name: 'VIP Area', pct: 50, level: 'med' },
  { id: 'L', name: 'Parking P1', pct: 84, level: 'high' },
];

/** Alert messages pool */
const ALERT_TEMPLATES = [
  { msg: '⚠️ Zone G (North Concourse) approaching critical capacity — 93%', level: 'critical' },
  { msg: '🔴 Food Court A at 78% — consider redirecting fans to Court B', level: 'high' },
  { msg: '🟡 Zone A (North Stand) at 89% — monitor closely', level: 'high' },
  { msg: '🟢 Zone B (South Stand) at comfortable 45% capacity', level: 'low' },
  { msg: '🔵 Gate D additional stewards deployed — wait time reduced to 4 min', level: 'low' },
  { msg: '⚠️ Parking P1 at 84% — recommend redirecting to P3', level: 'medium' },
];

let _crowdSimInterval = null;
let _currentZones = [...CROWD_ZONES];

/**
 * Renders the zone density grid.
 */
function renderZoneGrid() {
  const grid = getEl('zone-density-grid');
  if (!grid) return;

  grid.innerHTML = '';
  _currentZones.forEach(zone => {
    const cell = document.createElement('div');
    cell.className = `zone-cell zone-${zone.level}`;
    cell.id = `zone-cell-${zone.id}`;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${zone.name}: ${zone.pct}% capacity, ${zone.level} density`);
    cell.setAttribute('data-tooltip', `${zone.name}: ${zone.pct}%`);
    cell.innerHTML = `<div>${zone.id}</div><div>${zone.pct}%</div><div style="font-size:0.6rem;font-weight:400">${zone.name.substring(0,8)}</div>`;
    grid.appendChild(cell);
  });
}

/**
 * Renders the initial crowd alerts feed.
 */
function renderAlertsFeed() {
  const list = getEl('crowd-alerts-list');
  if (!list) return;

  list.innerHTML = '';
  ALERT_TEMPLATES.slice(0, 4).forEach((alert, i) => {
    const timeAgo = `${(i + 1) * 2}m ago`;
    addAlert(list, alert.msg, alert.level, timeAgo);
  });
}

/**
 * Adds a new alert item to the alerts feed.
 * @param {HTMLElement} list - The alerts list element
 * @param {string} message - Alert message
 * @param {string} level - Alert level (low|medium|high|critical)
 * @param {string} [time] - Time label
 */
function addAlert(list, message, level, time = formatTime()) {
  const item = document.createElement('div');
  item.className = `alert-item alert-${level}`;
  item.setAttribute('role', 'listitem');
  item.innerHTML = `<span>${sanitizeHTML(message)}</span><span class="alert-time">${sanitizeHTML(time)}</span>`;

  // Prepend to show newest first
  list.insertBefore(item, list.firstChild);

  // Keep max 8 alerts
  while (list.children.length > 8) {
    list.removeChild(list.lastChild);
  }
}

/**
 * Updates the capacity gauge display.
 * @param {number} pct - Capacity percentage (0-100)
 */
function updateCapacityGauge(pct) {
  const gaugeFill = getEl('gauge-fill');
  const capacityPct = getEl('capacity-pct');
  const capacityCount = getEl('capacity-count');

  if (gaugeFill) {
    // 251 is the approximate arc length of the SVG path
    const offset = 251 - (pct / 100) * 251;
    gaugeFill.setAttribute('stroke-dashoffset', offset.toFixed(0));
  }

  if (capacityPct) capacityPct.textContent = `${pct}%`;

  const total = 82500;
  const current = Math.round((pct / 100) * total);
  if (capacityCount) capacityCount.textContent = `${formatNumber(current)} / ${formatNumber(total)}`;

  const gauge = getEl('capacity-gauge');
  if (gauge) gauge.setAttribute('aria-label', `Stadium capacity: ${pct}% (${formatNumber(current)} of ${formatNumber(total)} fans)`);

  const badge = getEl('crowd-alert-badge');
  if (badge) {
    if (pct >= 90) { badge.textContent = '🔴 Critical'; badge.className = 'module-badge badge-alert'; }
    else if (pct >= 75) { badge.textContent = '🟡 High'; badge.className = 'module-badge badge-alert'; }
    else { badge.textContent = '🟢 Monitoring'; badge.className = 'module-badge'; }
  }
}

/**
 * Dispatches a crowd alert with AI-generated message.
 */
async function dispatchAlert() {
  const btn = getEl('dispatch-btn');
  if (btn) btn.disabled = true;

  showToast('🚨 Alert dispatched to all stewards in Zone G and A', 'warning', 5000);
  announceToScreenReader('Emergency alert dispatched. Stewards notified in Zones G and A.', 'assertive');

  const list = getEl('crowd-alerts-list');
  if (list) {
    addAlert(list, '🚨 DISPATCH: All available stewards report to North Concourse (Zone G) immediately', 'critical');
  }

  setTimeout(() => { if (btn) btn.disabled = false; }, 3000);
}

/**
 * Requests AI crowd rebalancing recommendation.
 */
async function aiRebalance() {
  const recText = getEl('crowd-ai-text');
  if (recText) recText.textContent = '🤖 Analyzing crowd patterns...';

  showLoading('AI analyzing crowd data...');

  try {
    const prompt = `Current crowd data: North Stand 89%, Zone G (concourse) 93% critical, Food Court A 78%, South Stand 45% low. Provide 3 specific crowd rebalancing actions with estimated impact times.`;
    const response = await generateAIResponse(prompt, 'crowd');

    if (recText) {
      recText.innerHTML = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }
    announceToScreenReader('AI rebalancing recommendation ready.');
  } catch (_) {
    if (recText) recText.textContent = 'Unable to generate recommendation. Please try again.';
  } finally {
    hideLoading();
  }
}

/**
 * Simulates a crowd change for demonstration purposes.
 */
function simulateCrowdChange() {
  _currentZones = _currentZones.map(zone => {
    const delta = randomInt(-8, 8);
    const newPct = Math.max(10, Math.min(99, zone.pct + delta));
    let level = 'low';
    if (newPct >= 95) level = 'critical';
    else if (newPct >= 80) level = 'high';
    else if (newPct >= 60) level = 'med';
    return { ...zone, pct: newPct, level };
  });

  renderZoneGrid();

  const totalPct = Math.round(_currentZones.reduce((sum, z) => sum + z.pct, 0) / _currentZones.length);
  updateCapacityGauge(Math.min(95, totalPct));

  const alertLevel = totalPct > 80 ? 'high' : 'medium';
  const list = getEl('crowd-alerts-list');
  if (list) addAlert(list, `📊 Crowd simulation update: Average density ${totalPct}%`, alertLevel);

  showToast('Crowd simulation updated', 'info', 2000);
  announceToScreenReader(`Crowd data updated. Average capacity: ${totalPct}%`);
}

/**
 * Starts live crowd data auto-refresh simulation.
 */
function startCrowdLiveUpdate() {
  if (_crowdSimInterval) clearInterval(_crowdSimInterval);
  _crowdSimInterval = setInterval(() => {
    // Subtle fluctuations to simulate real-time data
    _currentZones = _currentZones.map(zone => {
      const delta = randomInt(-3, 3);
      const newPct = Math.max(10, Math.min(99, zone.pct + delta));
      let level = zone.level;
      if (newPct >= 95) level = 'critical';
      else if (newPct >= 80) level = 'high';
      else if (newPct >= 60) level = 'med';
      else level = 'low';
      return { ...zone, pct: newPct, level };
    });
    renderZoneGrid();
  }, 8000);
}

/**
 * Initializes the crowd management module.
 */
function initCrowd() {
  renderZoneGrid();
  renderAlertsFeed();
  updateCapacityGauge(75);
  startCrowdLiveUpdate();
}

// Expose globals
window.dispatchAlert = dispatchAlert;
window.aiRebalance = aiRebalance;
window.simulateCrowdChange = simulateCrowdChange;
