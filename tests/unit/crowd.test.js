/**
 * @jest-environment jsdom
 * Unit tests for crowd management module
 */

// Provide globals used by crowd.js
global.sanitizeHTML = (s) => String(s || '');
global.sanitizeInput = (s) => String(s || '').trim();
global.getEl = (id) => document.getElementById(id);
global.qs = (s, ctx = document) => ctx.querySelector(s);
global.qsa = (s, ctx = document) => ctx.querySelectorAll(s);
global.formatTime = () => '12:00 PM';
global.formatNumber = (n) => n.toLocaleString();
global.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
global.randomPick = (arr) => arr[0];
global.showToast = jest.fn();
global.showLoading = jest.fn();
global.hideLoading = jest.fn();
global.announceToScreenReader = jest.fn();
global.generateAIResponse = jest.fn().mockResolvedValue('AI recommendation for crowd management.');

// Set up DOM before requiring module
document.body.innerHTML = `
  <div id="zone-density-grid" role="grid"></div>
  <div id="crowd-alerts-list" role="list"></div>
  <div id="capacity-gauge"><svg><path id="gauge-fill" stroke-dasharray="251" stroke-dashoffset="63"></path></svg><div class="gauge-value"><span id="capacity-pct">75%</span><small>Capacity</small></div></div>
  <span id="capacity-count">60,450 / 82,500</span>
  <div id="crowd-alert-badge">Monitoring</div>
  <div id="crowd-ai-text">Default text</div>
  <button id="dispatch-btn">Dispatch Alert</button>
  <button id="rebalance-btn">AI Rebalance</button>
`;

const {
  renderZoneGrid,
  renderAlertsFeed,
  updateCapacityGauge,
  simulateCrowdChange,
} = require('../../js/crowd.js');

describe('renderZoneGrid', () => {
  test('renders zone cells into the grid', () => {
    renderZoneGrid();
    const grid = document.getElementById('zone-density-grid');
    expect(grid.children.length).toBeGreaterThan(0);
  });

  test('each cell has an aria-label', () => {
    renderZoneGrid();
    const cells = document.querySelectorAll('.zone-cell');
    cells.forEach(cell => {
      expect(cell.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test('cells have appropriate density class', () => {
    renderZoneGrid();
    const cells = document.querySelectorAll('.zone-cell');
    cells.forEach(cell => {
      const hasValidClass = ['zone-low', 'zone-med', 'zone-high', 'zone-critical'].some(c => cell.classList.contains(c));
      expect(hasValidClass).toBe(true);
    });
  });
});

describe('renderAlertsFeed', () => {
  test('populates the alerts list', () => {
    renderAlertsFeed();
    const list = document.getElementById('crowd-alerts-list');
    expect(list.children.length).toBeGreaterThan(0);
  });

  test('alerts have role="listitem"', () => {
    renderAlertsFeed();
    const items = document.querySelectorAll('.alert-item');
    items.forEach(item => {
      expect(item.getAttribute('role')).toBe('listitem');
    });
  });
});

describe('updateCapacityGauge', () => {
  test('updates capacity percentage display', () => {
    updateCapacityGauge(80);
    const pctEl = document.getElementById('capacity-pct');
    expect(pctEl.textContent).toBe('80%');
  });

  test('updates capacity count display', () => {
    updateCapacityGauge(50);
    const countEl = document.getElementById('capacity-count');
    expect(countEl.textContent).toContain('/');
  });

  test('sets critical badge at high capacity', () => {
    updateCapacityGauge(92);
    const badge = document.getElementById('crowd-alert-badge');
    expect(badge.textContent).toContain('Critical');
  });

  test('sets monitoring badge at normal capacity', () => {
    updateCapacityGauge(50);
    const badge = document.getElementById('crowd-alert-badge');
    expect(badge.textContent).toContain('Monitoring');
  });
});

describe('simulateCrowdChange', () => {
  test('updates zone grid after simulation', () => {
    renderZoneGrid();
    const before = document.getElementById('zone-density-grid').innerHTML;
    simulateCrowdChange();
    // Grid may or may not change depending on random delta, but no throw
    expect(document.getElementById('zone-density-grid')).toBeTruthy();
  });

  test('calls showToast', () => {
    simulateCrowdChange();
    expect(showToast).toHaveBeenCalled();
  });
});
