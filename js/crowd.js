/**
 * @fileoverview Crowd Management Module — Real-time crowd density monitoring
 * @module crowd
 * @description Provides real-time crowd density visualization, AI-powered
 *              rebalancing recommendations, alert management, and live
 *              simulation for FIFA World Cup 2026 venues.
 */

'use strict';

/* -------- Constants -------- */

/** @const {number} Maximum stadium capacity (MetLife Stadium, NJ) */
const STADIUM_CAPACITY = 82500;

/** @const {number} SVG arc length for the circular capacity gauge */
const GAUGE_ARC_LENGTH = 251;

/** @const {number} Maximum alerts to show in the feed */
const MAX_ALERTS = 8;

/** @const {number} Live refresh interval in milliseconds */
const LIVE_UPDATE_INTERVAL_MS = 8000;

/** @const {number} Minor fluctuation delta for live updates (±3) */
const LIVE_DELTA_RANGE = 3;

/**
 * @const {number} Critical density threshold percentage
 * Above this level the zone is considered critically overloaded.
 */
const DENSITY_CRITICAL = 95;

/** @const {number} High density threshold percentage */
const DENSITY_HIGH = 80;

/** @const {number} Medium density threshold percentage */
const DENSITY_MED = 60;

/* -------- Data -------- */

/**
 * @typedef {Object} CrowdZone
 * @property {string} id     - Zone identifier letter (A–L)
 * @property {string} name   - Human-readable zone name
 * @property {number} pct    - Current occupancy percentage (0–100)
 * @property {string} level  - Density level: 'low' | 'med' | 'high' | 'critical'
 */

/** @type {CrowdZone[]} Initial crowd zone configuration */
const CROWD_ZONES = [
  { id: 'A', name: 'North Stand',   pct: 89, level: 'high'     },
  { id: 'B', name: 'South Stand',   pct: 45, level: 'low'      },
  { id: 'C', name: 'East Upper',    pct: 67, level: 'med'      },
  { id: 'D', name: 'West Upper',    pct: 72, level: 'med'      },
  { id: 'E', name: 'Gate A Area',   pct: 55, level: 'med'      },
  { id: 'F', name: 'Gate B Area',   pct: 31, level: 'low'      },
  { id: 'G', name: 'Concourse N',   pct: 93, level: 'critical' },
  { id: 'H', name: 'Fan Zone',      pct: 62, level: 'med'      },
  { id: 'I', name: 'Food Court A',  pct: 78, level: 'high'     },
  { id: 'J', name: 'Food Court B',  pct: 25, level: 'low'      },
  { id: 'K', name: 'VIP Area',      pct: 50, level: 'med'      },
  { id: 'L', name: 'Parking P1',    pct: 84, level: 'high'     },
];

/**
 * @typedef {Object} AlertTemplate
 * @property {string} msg   - Alert message text
 * @property {string} level - Severity level: 'low' | 'medium' | 'high' | 'critical'
 */

/** @type {AlertTemplate[]} Pre-populated alert messages for initial render */
const ALERT_TEMPLATES = [
  { msg: '⚠️ Zone G (North Concourse) approaching critical capacity — 93%', level: 'critical' },
  { msg: '🔴 Food Court A at 78% — consider redirecting fans to Court B',   level: 'high'     },
  { msg: '🟡 Zone A (North Stand) at 89% — monitor closely',                level: 'high'     },
  { msg: '🟢 Zone B (South Stand) at comfortable 45% capacity',             level: 'low'      },
  { msg: '🔵 Gate D stewards deployed — wait time reduced to 4 min',        level: 'low'      },
  { msg: '⚠️ Parking P1 at 84% — recommend redirecting to P3',              level: 'medium'   },
];

/* -------- Module State -------- */

/** @type {number|null} Interval ID for the live update ticker */
let _crowdSimInterval = null;

/** @type {CrowdZone[]} Mutable working copy of crowd zone data */
let _currentZones = [...CROWD_ZONES];

/* -------- Private Helpers -------- */

/**
 * Determines the density level string from a percentage value.
 * @param {number} pct - Occupancy percentage (0–100)
 * @returns {'critical'|'high'|'med'|'low'} Density level string
 */
function _densityLevel(pct) {
  if (pct >= DENSITY_CRITICAL) return 'critical';
  if (pct >= DENSITY_HIGH)     return 'high';
  if (pct >= DENSITY_MED)      return 'med';
  return 'low';
}

/**
 * Converts an occupancy percentage to an average across all zones.
 * @param {CrowdZone[]} zones - Array of zone objects
 * @returns {number} Rounded average percentage
 */
function _averagePct(zones) {
  return Math.round(zones.reduce((sum, z) => sum + z.pct, 0) / zones.length);
}

/* -------- Public API -------- */

/**
 * Renders the zone density grid in the DOM.
 * Each zone is represented as an accessible grid cell with density colouring.
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

    const label = document.createElement('div');
    label.textContent = zone.id;

    const pctEl = document.createElement('div');
    pctEl.textContent = `${zone.pct}%`;

    const nameEl = document.createElement('div');
    nameEl.className = 'zone-name';
    nameEl.textContent = zone.name.substring(0, 8);

    cell.appendChild(label);
    cell.appendChild(pctEl);
    cell.appendChild(nameEl);
    grid.appendChild(cell);
  });
}

/**
 * Renders the initial crowd alerts feed with pre-populated alerts.
 */
function renderAlertsFeed() {
  const list = getEl('crowd-alerts-list');
  if (!list) return;

  list.innerHTML = '';
  ALERT_TEMPLATES.slice(0, 4).forEach((alert, i) => {
    addAlert(list, alert.msg, alert.level, `${(i + 1) * 2}m ago`);
  });
}

/**
 * Adds a new alert item to the top of the alerts feed.
 * Trims the feed to MAX_ALERTS entries to prevent DOM bloat.
 *
 * @param {HTMLElement} list    - The alerts list container element
 * @param {string}      message - Alert message text
 * @param {string}      level   - Alert severity: 'low'|'medium'|'high'|'critical'
 * @param {string}      [time]  - Display timestamp, defaults to current time
 */
function addAlert(list, message, level, time = formatTime()) {
  const item = document.createElement('div');
  item.className = `alert-item alert-${level}`;
  item.setAttribute('role', 'listitem');

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'alert-time';
  timeSpan.textContent = time;

  item.appendChild(msgSpan);
  item.appendChild(timeSpan);

  // Prepend so newest alerts appear first
  list.insertBefore(item, list.firstChild);

  // Trim old alerts
  while (list.children.length > MAX_ALERTS) {
    list.removeChild(list.lastChild);
  }
}

/**
 * Updates the SVG capacity gauge and related text displays.
 *
 * @param {number} pct - Overall stadium occupancy percentage (0–100)
 */
function updateCapacityGauge(pct) {
  const gaugeFill     = getEl('gauge-fill');
  const capacityPct   = getEl('capacity-pct');
  const capacityCount = getEl('capacity-count');

  if (gaugeFill) {
    const offset = GAUGE_ARC_LENGTH - (pct / 100) * GAUGE_ARC_LENGTH;
    gaugeFill.setAttribute('stroke-dashoffset', offset.toFixed(0));
  }

  if (capacityPct) capacityPct.textContent = `${pct}%`;

  const current = Math.round((pct / 100) * STADIUM_CAPACITY);
  if (capacityCount) {
    capacityCount.textContent = `${formatNumber(current)} / ${formatNumber(STADIUM_CAPACITY)}`;
  }

  const gauge = getEl('capacity-gauge');
  if (gauge) {
    gauge.setAttribute('aria-label', `Stadium capacity: ${pct}% (${formatNumber(current)} of ${formatNumber(STADIUM_CAPACITY)} fans)`);
  }

  const badge = getEl('crowd-alert-badge');
  if (badge) {
    if (pct >= DENSITY_CRITICAL) {
      badge.textContent = '🔴 Critical';
      badge.className = 'module-badge badge-alert';
    } else if (pct >= DENSITY_HIGH) {
      badge.textContent = '🟡 High';
      badge.className = 'module-badge badge-alert';
    } else {
      badge.textContent = '🟢 Monitoring';
      badge.className = 'module-badge';
    }
  }
}

/**
 * Dispatches an emergency alert to all stewards in the critical zones.
 * Disables the dispatch button briefly to prevent duplicate dispatches.
 * @returns {Promise<void>}
 */
async function dispatchAlert() {
  const btn = getEl('dispatch-btn');
  if (btn) btn.disabled = true;

  showToast('🚨 Alert dispatched to all stewards in Zone G and A', 'warning', 5000);
  announceToScreenReader('Emergency alert dispatched. Stewards notified in Zones G and A.', 'assertive');

  const list = getEl('crowd-alerts-list');
  if (list) {
    addAlert(list, '🚨 DISPATCH: All stewards report to North Concourse (Zone G) immediately', 'critical');
  }

  setTimeout(() => { if (btn) btn.disabled = false; }, 3000);
}

/**
 * Requests an AI-powered crowd rebalancing recommendation
 * and renders the result in the crowd module panel.
 * @returns {Promise<void>}
 */
async function aiRebalance() {
  const recText = getEl('crowd-ai-text');
  if (recText) recText.textContent = '🤖 Analyzing crowd patterns...';

  showLoading('AI analyzing crowd data...');

  try {
    const prompt = [
      'Current crowd data at MetLife Stadium (FIFA WC 2026):',
      'North Stand 89%, Zone G (concourse) 93% critical,',
      'Food Court A 78%, South Stand 45% low.',
      'Provide 3 specific crowd rebalancing actions with estimated impact times.',
    ].join(' ');

    const response = await generateAIResponse(prompt, 'crowd');

    if (recText) {
      recText.innerHTML = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }
    announceToScreenReader('AI rebalancing recommendation ready.');
  } catch (_err) {
    if (recText) recText.textContent = 'Unable to generate recommendation. Please try again.';
  } finally {
    hideLoading();
  }
}

/**
 * Applies a random density change to all zones to simulate real-time
 * crowd movement and re-renders the grid and gauge.
 */
function simulateCrowdChange() {
  _currentZones = _currentZones.map(zone => {
    const delta  = randomInt(-8, 8);
    const newPct = Math.max(10, Math.min(99, zone.pct + delta));
    return { ...zone, pct: newPct, level: _densityLevel(newPct) };
  });

  renderZoneGrid();

  const totalPct  = Math.min(95, _averagePct(_currentZones));
  updateCapacityGauge(totalPct);

  const alertLevel = totalPct > DENSITY_HIGH ? 'high' : 'medium';
  const list = getEl('crowd-alerts-list');
  if (list) {
    addAlert(list, `📊 Crowd simulation update: Average density ${totalPct}%`, alertLevel);
  }

  showToast('Crowd simulation updated', 'info', 2000);
  announceToScreenReader(`Crowd data updated. Average capacity: ${totalPct}%`);
}

/**
 * Starts the live crowd data auto-refresh simulation using subtle
 * fluctuations to mimic real venue sensor streams.
 */
function startCrowdLiveUpdate() {
  if (_crowdSimInterval) clearInterval(_crowdSimInterval);

  _crowdSimInterval = setInterval(() => {
    _currentZones = _currentZones.map(zone => {
      const delta  = randomInt(-LIVE_DELTA_RANGE, LIVE_DELTA_RANGE);
      const newPct = Math.max(10, Math.min(99, zone.pct + delta));
      return { ...zone, pct: newPct, level: _densityLevel(newPct) };
    });
    renderZoneGrid();
  }, LIVE_UPDATE_INTERVAL_MS);
}

/**
 * Initializes the crowd management module:
 * renders the zone grid, alerts feed, gauge, and starts live updates.
 */
function initCrowd() {
  renderZoneGrid();
  renderAlertsFeed();
  updateCapacityGauge(75);
  startCrowdLiveUpdate();
}

/* -------- Global + Test Exports -------- */
window.dispatchAlert      = dispatchAlert;
window.aiRebalance        = aiRebalance;
window.simulateCrowdChange = simulateCrowdChange;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderZoneGrid,
    renderAlertsFeed,
    updateCapacityGauge,
    simulateCrowdChange,
  };
}
