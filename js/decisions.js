/**
 * @fileoverview Real-Time Decision Support Module
 * @module decisions
 */

'use strict';

/** KPI trend data for the canvas chart */
const KPI_DATA = {
  labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 'Now'],
  satisfaction: [4.2, 4.3, 4.4, 4.5, 4.6, 4.6, 4.7, 4.7],
  response: [5.1, 4.8, 4.5, 4.2, 3.9, 3.5, 3.2, 3.2],
  transit: [78, 81, 83, 85, 87, 90, 92, 92],
};

/** Scenario response templates */
const SCENARIO_TEMPLATES = {
  'gate-closure': {
    title: '🚪 Gate A Closure Protocol',
    severity: 'High',
    color: '#ff6d00',
    steps: [
      'Immediately redirect all Gate A entry to Gates B and C',
      'Deploy 4 additional stewards to Gate B junction to manage increased flow',
      'Activate PA announcement: "All fans, please use Gates B, C, and D — Gate A is temporarily closed"',
      'Notify transport operators to adjust drop-off points to east side',
      'Estimated crowd impact: 8-minute wait increase at Gate B; normalizes in 20 min',
    ],
  },
  'evacuation': {
    title: '🚨 Emergency Evacuation Protocol',
    severity: 'Critical',
    color: '#ff1744',
    steps: [
      'IMMEDIATE: Activate emergency PA system with evacuation announcement',
      'Open ALL gates simultaneously including emergency exits E1-E8',
      'Halt all match play — contact referee through official channels',
      'Dispatch all available stewards to crowd flow management positions',
      'Emergency services: Police, Fire, EMS notified automatically via stadium system',
      'Assembly points: North and South parking lots — guide fans via stewards',
      'Target: Full evacuation within 8 minutes per FIFA safety standards',
    ],
  },
  'vip-arrival': {
    title: '👑 VIP Arrival Protocol',
    severity: 'Low',
    color: '#00d4aa',
    steps: [
      'Clear VIP vehicle lane (Gate A East side) — 15 min before arrival',
      'Position protocol team and security escort at Gate A VIP entrance',
      'Notify stadium director and host committee — 10 min ETA',
      'Prepare VIP lounge (Level 4, Suite 401) — catering on standby',
      'Media area access: Press pool positioned at designated area only',
    ],
  },
  'weather-delay': {
    title: '⛈️ Weather Delay Protocol',
    severity: 'High',
    color: '#7c4dff',
    steps: [
      'Monitor weather radar — delay match if lightning within 8km radius',
      'Open all indoor concourse areas and covered spaces for fan shelter',
      'Halt outdoor Fan Zone and plaza activities immediately',
      'Brief all gate stewards on weather shelter protocols via radio',
      'PA announcement: "Fans are advised to take shelter in concourse areas"',
      'Medical team: Stand by for weather-related incidents',
      'Match delay: Maximum 45 minutes; postponement decision at 60 minutes',
    ],
  },
  'power-outage': {
    title: '💡 Power Outage Response',
    severity: 'Critical',
    color: '#ff1744',
    steps: [
      'Emergency backup power activates automatically — 10 second delay expected',
      'Critical systems maintained: Emergency lighting, PA, security cameras, medical',
      'Halt all escalators and non-essential electrical systems',
      'Facilities team: Report to main electrical panel immediately',
      'Match suspended per FIFA protocol — referee to be notified',
      'Expected restoration time: 15-20 minutes from backup power',
      'If outage exceeds 45 min: Activate event postponement protocol',
    ],
  },
  'capacity-overflow': {
    title: '📊 Capacity Overflow Management',
    severity: 'High',
    color: '#ff6d00',
    steps: [
      'Close public ticket gates when capacity reaches 98%',
      'Activate overflow viewing area in South Plaza (large screen)',
      'Notify transport operators to suspend additional services until capacity drops',
      'PA announcement: "The stadium has reached capacity. Fans without access are welcome in the Fan Zone"',
      'Monitor exit flows and reopen gates when capacity drops below 90%',
    ],
  },
};

/**
 * Simulates a specific emergency or operational scenario.
 * @param {string} scenarioKey - The scenario identifier
 */
async function simulateScenario(scenarioKey) {
  const resultEl = getEl('scenario-result');
  if (!resultEl) return;

  const template = SCENARIO_TEMPLATES[scenarioKey];

  if (template) {
    resultEl.innerHTML = `
      <div class="result-heading" style="color:${template.color}">${template.title}</div>
      <div style="margin-bottom:1rem">
        <span class="tag" style="background:rgba(255,23,68,0.1);color:${template.color};border-color:${template.color}">⚡ Severity: ${template.severity}</span>
      </div>
      <div class="timeline">
        ${template.steps.map(step => `<div class="timeline-item">${sanitizeHTML(step)}</div>`).join('')}
      </div>
      <div class="warning-banner" style="margin-top:1rem">
        <span class="warn-icon">🤖</span>
        <span>AI-generated protocol. Always verify with your official FIFA event management team before execution.</span>
      </div>`;
    resultEl.classList.add('visible');
    announceToScreenReader(`Scenario simulation loaded: ${template.title}. Priority: ${template.severity}.`);
  }

  // Enhance with live AI if available
  if (isAIActive()) {
    try {
      const aiResponse = await generateAIResponse(
        `Provide additional tactical advice for: ${scenarioKey.replace('-', ' ')} at FIFA WC 2026 stadium with 82,500 fans.`,
        'decisions',
        { maxOutputTokens: 150 }
      );
      const aiNote = document.createElement('div');
      aiNote.className = 'ai-recommendation';
      aiNote.style.marginTop = '1rem';
      aiNote.innerHTML = `<div class="ai-rec-header"><span class="ai-rec-icon">🤖</span><strong>Live AI Analysis</strong></div><p>${sanitizeHTML(aiResponse)}</p>`;
      resultEl.appendChild(aiNote);
    } catch (_) { /* Silent fail — template already shown */ }
  }
}

/**
 * Handles global AI command form submission.
 * @param {Event} e - Form submit event
 */
async function globalCommand(e) {
  e.preventDefault();
  const input = getEl('command-input');
  const resultEl = getEl('command-result');
  const btn = getEl('command-submit-btn');

  if (!input || !resultEl) return;

  const command = sanitizeInput(input.value);
  if (!command) return;

  if (!checkRateLimit('global_command', 8, 60000)) {
    showToast('⏳ Command rate limit reached. Please wait.', 'warning');
    return;
  }

  if (btn) btn.disabled = true;
  showLoading('AI processing command...');

  try {
    const response = await generateAIResponse(command, 'decisions');
    resultEl.innerHTML = `
      <div class="result-heading">⚡ AI Response</div>
      <div class="warning-banner" style="border-left-color:var(--color-secondary)">
        <span class="warn-icon">❓</span>
        <span style="font-style:italic;color:var(--text-muted)">"${sanitizeHTML(command)}"</span>
      </div>
      <div style="margin-top:1rem;line-height:1.8">${response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>`;
    resultEl.classList.add('visible');
    input.value = '';
    announceToScreenReader('AI command response ready.');
  } catch (_) {
    resultEl.innerHTML = '<p>⚠️ Command could not be processed. Please try again.</p>';
    resultEl.classList.add('visible');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
  }
}

/**
 * Renders the KPI chart using Canvas API.
 */
function renderKPIChart() {
  const canvas = getEl('kpi-chart');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const n = KPI_DATA.labels.length;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.roundRect(0, 0, W, H, 8);
  ctx.fill();

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
  }

  // Draw transit % line (normalized 0-100 → chartH)
  _drawLine(ctx, KPI_DATA.transit, 0, 100, pad, chartW, chartH, n, '#00d4aa', 2.5);

  // Draw satisfaction line (normalized 0-5 → chartH)
  _drawLine(ctx, KPI_DATA.satisfaction.map(v => v / 5 * 100), 0, 100, pad, chartW, chartH, n, '#7c4dff', 2.5);

  // X-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  KPI_DATA.labels.forEach((label, i) => {
    const x = pad.left + (i / (n - 1)) * chartW;
    ctx.fillText(label, x, H - 8);
  });

  // Legend
  const legendItems = [
    { label: 'Transit Score', color: '#00d4aa' },
    { label: 'Satisfaction (×20)', color: '#7c4dff' },
  ];
  legendItems.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(pad.left + i * 120, 6, 12, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, pad.left + i * 120 + 16, 12);
  });
}

/**
 * Draws a data line on the KPI chart canvas.
 * @private
 */
function _drawLine(ctx, data, minVal, maxVal, pad, chartW, chartH, n, color, lineWidth) {
  const range = maxVal - minVal;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '05');

  data.forEach((val, i) => {
    const x = pad.left + (i / (n - 1)) * chartW;
    const y = pad.top + chartH - ((val - minVal) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill area under line
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw data points
  ctx.fillStyle = color;
  data.forEach((val, i) => {
    const x = pad.left + (i / (n - 1)) * chartW;
    const y = pad.top + chartH - ((val - minVal) / range) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Animates KPI values with counting effect.
 */
function animateKPIs() {
  const kpiEls = [
    { id: 'kpi-satisfaction', final: '4.7/5' },
    { id: 'kpi-response', final: '3.2m' },
    { id: 'kpi-transit', final: '92%' },
    { id: 'kpi-eco', final: '78%' },
  ];

  kpiEls.forEach(({ id, final }) => {
    const el = getEl(id);
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = final;
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.5s ease';
      }, randomInt(200, 600));
    }
  });
}

/**
 * Initializes the decision support module.
 */
function initDecisions() {
  renderKPIChart();
  animateKPIs();

  // Periodically update KPI values to simulate real-time
  setInterval(() => {
    const satisfactionEl = getEl('kpi-satisfaction');
    if (satisfactionEl) {
      const val = (4.5 + Math.random() * 0.4).toFixed(1);
      satisfactionEl.textContent = `${val}/5`;
    }
  }, 15000);
}

// Expose globals
window.simulateScenario = simulateScenario;
window.globalCommand = globalCommand;
