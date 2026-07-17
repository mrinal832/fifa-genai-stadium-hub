/**
 * @jest-environment jsdom
 */
// Unit tests for sustainability module

global.sanitizeHTML = (s) => String(s || '');
global.getEl = (id) => document.getElementById(id);
global.qs = (s, ctx = document) => ctx.querySelector(s);
global.announceToScreenReader = jest.fn();

document.body.innerHTML = `
  <select id="carbon-transport">
    <option value="metro">Metro</option>
    <option value="drive">Drive</option>
  </select>
  <input type="number" id="carbon-distance" value="50" />
  <div class="carbon-result"></div>
  <span id="carbon-kg">0</span>
  <span id="carbon-trees">0</span>
`;

const { updateCarbon } = require('../../js/sustainability.js');

describe('updateCarbon', () => {
  beforeEach(() => {
    document.getElementById('carbon-transport').value = 'metro';
    document.getElementById('carbon-distance').value = '50';
    document.getElementById('carbon-kg').textContent = '0';
    document.getElementById('carbon-trees').textContent = '0';
  });

  test('calculates metro footprint correctly', () => {
    updateCarbon();
    // 50 * 0.027 = 1.35
    expect(document.getElementById('carbon-kg').textContent).toBe('1.35');
  });

  test('calculates drive footprint correctly', () => {
    document.getElementById('carbon-transport').value = 'drive';
    updateCarbon();
    // 50 * 0.192 = 9.60
    expect(document.getElementById('carbon-kg').textContent).toBe('9.60');
  });

  test('updates trees equivalent', () => {
    updateCarbon();
    const trees = parseFloat(document.getElementById('carbon-trees').textContent);
    expect(trees).toBeGreaterThan(0);
  });

  test('handles invalid distance gracefully', () => {
    document.getElementById('carbon-distance').value = '-10';
    updateCarbon();
    // Should return early, leaving values unchanged from initial mock setup state (which is 0 from innerHTML)
    expect(document.getElementById('carbon-kg').textContent).toBe('0');
  });

  test('calls announceToScreenReader', () => {
    updateCarbon();
    expect(announceToScreenReader).toHaveBeenCalled();
  });
});
