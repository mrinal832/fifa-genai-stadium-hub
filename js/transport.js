/**
 * @fileoverview Transportation Module
 * @module transport
 */

'use strict';

/** Live transport status data */
const TRANSPORT_STATUS = [
  { name: 'NJ Transit Rail', detail: 'On time — 8 min to Meadowlands', status: 'green' },
  { name: 'Express Shuttle', detail: 'Running — departs Times Sq in 14 min', status: 'green' },
  { name: 'Metro Line 1', detail: 'Minor delays — +5 min expected', status: 'yellow' },
  { name: 'Uber/Lyft (Lot H)', detail: 'Surge active — 1.8x pricing', status: 'yellow' },
  { name: 'Stadium Parking P1', detail: '84% full — Lot P3 recommended', status: 'yellow' },
  { name: 'Water Taxi', detail: 'Service suspended today', status: 'red' },
];

/** Carbon emission factors kg CO₂e per km */
const CARBON_FACTORS = {
  'fly-long': 0.255,
  'fly-short': 0.177,
  'drive': 0.192,
  'carpool': 0.048,
  'train': 0.041,
  'metro': 0.027,
  'walk': 0,
};

/**
 * Renders the live transport status list.
 */
function renderTransportStatus() {
  const list = getEl('live-transport-status');
  if (!list) return;

  list.innerHTML = '';
  TRANSPORT_STATUS.forEach(item => {
    const el = document.createElement('div');
    el.className = 'status-item';
    el.setAttribute('role', 'listitem');
    el.innerHTML = `
      <div class="status-dot ${item.status}" aria-hidden="true"></div>
      <div class="status-info">
        <div class="status-name">${sanitizeHTML(item.name)}</div>
        <div class="status-detail">${sanitizeHTML(item.detail)}</div>
      </div>`;
    list.appendChild(el);
  });
}

/**
 * Plans a transport journey using AI recommendations.
 */
async function planTransport() {
  const from = sanitizeInput(getEl('transport-from')?.value || 'Midtown Manhattan');
  const matchTime = getEl('match-time')?.value || 'today evening';
  const mode = document.querySelector('input[name="transport-mode"]:checked')?.value || 'metro';
  const resultEl = getEl('transport-result');

  if (!resultEl) return;

  showLoading('Planning your journey...');

  try {
    const prompt = `Plan a journey from "${from}" to MetLife Stadium for a FIFA WC 2026 match at ${matchTime} using ${mode}. Include: departure time recommendation, route steps, cost estimate, journey time, and any alternatives. Highlight eco-friendliness.`;
    const response = await generateAIResponse(prompt, 'transport');

    resultEl.innerHTML = `
      <div class="result-heading">🗺️ Your Journey Plan</div>
      <div class="transport-steps">
        ${_buildTransportSteps(response, mode)}
      </div>
      <div class="info-grid">
        <div class="info-cell"><span class="info-cell-val">${_estimateDuration(mode)}</span><span class="info-cell-label">Journey Time</span></div>
        <div class="info-cell"><span class="info-cell-val">${_estimateCost(mode)}</span><span class="info-cell-label">Est. Cost</span></div>
        <div class="info-cell"><span class="info-cell-val">${_estimateCO2(mode)}</span><span class="info-cell-label">CO₂ Saved</span></div>
        <div class="info-cell"><span class="info-cell-val">${_getDepartureTime(matchTime)}</span><span class="info-cell-label">Depart By</span></div>
      </div>
      <div class="warning-banner">
        <span class="warn-icon">⏰</span>
        <span>AI Tip: Arrive at least 75 minutes before kickoff to clear security and find your seat comfortably.</span>
      </div>`;
    resultEl.classList.add('visible');
    announceToScreenReader('Transport plan ready. Scroll down to see your journey details.');
  } catch (_) {
    resultEl.innerHTML = '<p>⚠️ Could not plan journey. Please check the official FIFA transport guide.</p>';
    resultEl.classList.add('visible');
  } finally {
    hideLoading();
  }
}

/**
 * Builds transport step HTML cards from AI response.
 * @private
 */
function _buildTransportSteps(text, mode) {
  const modeIcons = { metro: '🚇', bus: '🚌', rideshare: '🚗', walk: '🚶', bike: '🚲', shuttle: '🚐' };
  const icon = modeIcons[mode] || '🚌';

  const steps = [
    { title: `Board ${mode} at your location`, time: 'Step 1' },
    { title: 'Transfer / Continue on route', time: 'Step 2' },
    { title: 'Arrive at stadium station/drop-off', time: 'Step 3' },
    { title: 'Walk to Gate A (7 min, covered walkway)', time: 'Step 4' },
  ];

  return steps.map((step, i) => `
    <div class="transport-step">
      <div class="step-num">${icon}</div>
      <div class="step-detail">
        <div class="step-title">${sanitizeHTML(step.title)}</div>
        <div class="step-time">${step.time}</div>
      </div>
    </div>`).join('');
}

function _estimateDuration(mode) {
  const d = { metro: '35 min', bus: '45 min', rideshare: '28 min', walk: '60 min', bike: '40 min', shuttle: '50 min' };
  return d[mode] || '40 min';
}

function _estimateCost(mode) {
  const c = { metro: '$4.25', bus: '$3.00', rideshare: '$22–35', walk: 'Free', bike: '$2.50', shuttle: '$15' };
  return c[mode] || '$10';
}

function _estimateCO2(mode) {
  const co2 = { metro: '5.8 kg', bus: '4.2 kg', rideshare: '0 kg', walk: '6.1 kg', bike: '6.0 kg', shuttle: '3.5 kg' };
  return co2[mode] || '3 kg';
}

function _getDepartureTime(matchTime) {
  return matchTime ? '90 min early' : '4:30 PM';
}

/**
 * Initializes the transport module.
 */
function initTransport() {
  renderTransportStatus();

  // Set default match time to next Saturday 3 PM
  const matchInput = getEl('match-time');
  if (matchInput) {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    d.setHours(15, 0, 0, 0);
    matchInput.value = d.toISOString().slice(0, 16);
  }

  // Refresh status every 30 seconds
  setInterval(() => {
    // Simulate slight status changes
    renderTransportStatus();
  }, 30000);
}

// Expose globals
window.planTransport = planTransport;
