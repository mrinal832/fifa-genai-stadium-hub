/**
 * @jest-environment jsdom
 */
// Unit tests for accessibility module

global.sanitizeHTML = (s) => String(s || '');
global.sanitizeInput = (s) => String(s || '').trim();
global.getEl = (id) => document.getElementById(id);
global.showToast = jest.fn();
global.announceToScreenReader = jest.fn();

// Mock SpeechSynthesis
global.window.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
};
global.SpeechSynthesisUtterance = jest.fn();

document.body.innerHTML = `
  <span id="current-font-size">100%</span>
  <input type="checkbox" id="toggle-audio" />
`;

const {
  toggleHighContrast,
  toggleLargeText,
  toggleAudioDesc,
  toggleReduceMotion,
  adjustFontSize,
  resetFontSize,
} = require('../../js/accessibility.js');

describe('toggleHighContrast', () => {
  afterEach(() => document.body.classList.remove('high-contrast'));

  test('adds class when enabled', () => {
    toggleHighContrast(true);
    expect(document.body.classList.contains('high-contrast')).toBe(true);
  });

  test('removes class when disabled', () => {
    document.body.classList.add('high-contrast');
    toggleHighContrast(false);
    expect(document.body.classList.contains('high-contrast')).toBe(false);
  });

  test('calls announceToScreenReader', () => {
    toggleHighContrast(true);
    expect(announceToScreenReader).toHaveBeenCalled();
  });
});

describe('toggleLargeText', () => {
  afterEach(() => document.body.classList.remove('large-text'));

  test('adds class when enabled', () => {
    toggleLargeText(true);
    expect(document.body.classList.contains('large-text')).toBe(true);
  });

  test('removes class when disabled', () => {
    document.body.classList.add('large-text');
    toggleLargeText(false);
    expect(document.body.classList.contains('large-text')).toBe(false);
  });
});

describe('toggleAudioDesc', () => {
  test('calls speechSynthesis when enabled', () => {
    toggleAudioDesc(true);
    expect(global.window.speechSynthesis.speak).toHaveBeenCalled();
  });

  test('calls cancel when disabled', () => {
    toggleAudioDesc(false);
    expect(global.window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});

describe('toggleReduceMotion', () => {
  afterEach(() => document.body.classList.remove('reduce-motion'));

  test('adds class when enabled', () => {
    toggleReduceMotion(true);
    expect(document.body.classList.contains('reduce-motion')).toBe(true);
  });
});

describe('adjustFontSize', () => {
  afterEach(() => resetFontSize());

  test('increases font size', () => {
    adjustFontSize(1);
    expect(document.documentElement.style.fontSize).toBe('110%');
    expect(document.getElementById('current-font-size').textContent).toBe('110%');
  });

  test('decreases font size', () => {
    adjustFontSize(-1);
    expect(document.documentElement.style.fontSize).toBe('90%');
  });

  test('caps at 150%', () => {
    for (let i = 0; i < 10; i++) adjustFontSize(1);
    expect(document.documentElement.style.fontSize).toBe('150%');
  });

  test('floors at 80%', () => {
    for (let i = 0; i < 10; i++) adjustFontSize(-1);
    expect(document.documentElement.style.fontSize).toBe('80%');
  });
});

describe('resetFontSize', () => {
  test('resets to 100%', () => {
    adjustFontSize(1);
    resetFontSize();
    expect(document.documentElement.style.fontSize).toBe('100%');
    expect(document.getElementById('current-font-size').textContent).toBe('100%');
  });
});
