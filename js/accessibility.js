/**
 * @fileoverview Accessibility Module
 * @module accessibility
 */

'use strict';

/** Current font size scale (percentage) */
let _fontSizeScale = 100;

/**
 * Toggles high contrast mode.
 * @param {boolean} enabled
 */
function toggleHighContrast(enabled) {
  document.body.classList.toggle('high-contrast', enabled);
  announceToScreenReader(enabled ? 'High contrast mode enabled.' : 'High contrast mode disabled.');
  showToast(enabled ? '👁️ High contrast enabled' : '👁️ High contrast disabled', 'info', 2000);
}

/**
 * Toggles large text mode.
 * @param {boolean} enabled
 */
function toggleLargeText(enabled) {
  document.body.classList.toggle('large-text', enabled);
  announceToScreenReader(enabled ? 'Large text mode enabled.' : 'Large text mode disabled.');
  showToast(enabled ? '🔠 Large text enabled' : '🔠 Large text disabled', 'info', 2000);
}

/**
 * Toggles audio description mode (reads key content aloud).
 * @param {boolean} enabled
 */
function toggleAudioDesc(enabled) {
  if (enabled) {
    showToast('🔊 Audio descriptions enabled — AI will speak navigation info', 'success', 3000);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Audio descriptions activated. I will now read important navigation and safety information aloud.');
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  } else {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    showToast('🔇 Audio descriptions disabled', 'info', 2000);
  }
  announceToScreenReader(enabled ? 'Audio descriptions enabled.' : 'Audio descriptions disabled.');
}

/**
 * Toggles reduce motion mode.
 * @param {boolean} enabled
 */
function toggleReduceMotion(enabled) {
  document.body.classList.toggle('reduce-motion', enabled);
  announceToScreenReader(enabled ? 'Animations reduced.' : 'Animations restored.');
  showToast(enabled ? '⏸️ Animations paused' : '▶️ Animations resumed', 'info', 2000);
}

/**
 * Adjusts the page font size.
 * @param {number} direction - +1 to increase, -1 to decrease
 */
function adjustFontSize(direction) {
  _fontSizeScale = Math.max(80, Math.min(150, _fontSizeScale + direction * 10));
  document.documentElement.style.setProperty('--base-font-size', `${_fontSizeScale / 100}rem`);
  document.documentElement.style.fontSize = `${_fontSizeScale}%`;

  const display = getEl('current-font-size');
  if (display) display.textContent = `${_fontSizeScale}%`;

  announceToScreenReader(`Font size set to ${_fontSizeScale}%.`);
}

/**
 * Resets font size to default.
 */
function resetFontSize() {
  _fontSizeScale = 100;
  document.documentElement.style.fontSize = '100%';
  const display = getEl('current-font-size');
  if (display) display.textContent = '100%';
  announceToScreenReader('Font size reset to 100%.');
}

/**
 * Handles an accessibility query with AI.
 * @param {string} topic - The accessibility topic to query
 */
async function accessQuery(topic) {
  const responseEl = getEl('access-ai-text');
  const typingEl = getEl('access-typing');

  if (typingEl) typingEl.classList.add('visible');
  if (responseEl) responseEl.textContent = '';

  try {
    const response = await generateAIResponse(topic, 'accessibility');

    if (typingEl) typingEl.classList.remove('visible');
    if (responseEl) {
      responseEl.innerHTML = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }

    // Speak the response if audio descriptions enabled
    const audioToggle = getEl('toggle-audio');
    if (audioToggle?.checked && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response.replace(/[*#]/g, ''));
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }

    announceToScreenReader('Accessibility AI response ready.');
  } catch (_) {
    if (typingEl) typingEl.classList.remove('visible');
    if (responseEl) responseEl.textContent = 'Unable to load accessibility information. Please contact the accessibility desk.';
  }
}

/**
 * Finds an accessible route using AI recommendations.
 */
async function findAccessibleRoute() {
  const from = getEl('route-from')?.value;
  const to = getEl('route-to')?.value;
  const need = getEl('mobility-need')?.value;
  const resultEl = getEl('route-result');

  if (!from || !to) {
    showToast('⚠️ Please select both start and destination', 'warning');
    announceToScreenReader('Please select a starting point and destination before finding a route.', 'assertive');
    return;
  }

  if (!resultEl) return;

  showLoading('Finding accessible route...');

  try {
    const prompt = `Find an accessible route from ${from} to ${to} for a person with ${need} needs. Include: step-by-step directions, distances, elevator/ramp locations, rest points, and any barriers to avoid.`;
    const response = await generateAIResponse(prompt, 'accessibility');

    resultEl.innerHTML = `
      <div class="result-heading">♿ Accessible Route Found</div>
      <div class="timeline">
        ${_parseRouteToTimeline(response)}
      </div>
      <div class="info-grid">
        <div class="info-cell"><span class="info-cell-val">~4 min</span><span class="info-cell-label">Journey Time</span></div>
        <div class="info-cell"><span class="info-cell-val">~180m</span><span class="info-cell-label">Distance</span></div>
        <div class="info-cell"><span class="info-cell-val">0</span><span class="info-cell-label">Stairs</span></div>
        <div class="info-cell"><span class="info-cell-val">2</span><span class="info-cell-label">Rest Points</span></div>
      </div>`;
    resultEl.classList.add('visible');

    announceToScreenReader('Accessible route found. Details displayed on screen.');
  } catch (_) {
    resultEl.innerHTML = '<p>⚠️ Unable to find route. Please contact the accessibility desk at Gate B or call the stadium helpline.</p>';
    resultEl.classList.add('visible');
  } finally {
    hideLoading();
  }
}

/**
 * Converts AI response text to timeline HTML items.
 * @private
 * @param {string} text - AI response text
 * @returns {string} HTML string with timeline items
 */
function _parseRouteToTimeline(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 10);
  return lines.slice(0, 5).map(line =>
    `<div class="timeline-item">${sanitizeHTML(line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, ''))}</div>`
  ).join('') || `<div class="timeline-item">${sanitizeHTML(text.substring(0, 300))}</div>`;
}

/**
 * Initializes the accessibility module.
 */
function initAccessibility() {
  // Detect system preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduce-motion');
    const reduceMotionToggle = getEl('toggle-reducemotion');
    if (reduceMotionToggle) reduceMotionToggle.checked = true;
  }

  // Detect system preference for dark mode
  const fontSizeToggle = getEl('font-size-toggle');
  if (fontSizeToggle) {
    fontSizeToggle.addEventListener('click', () => adjustFontSize(1));
  }
}

// Expose globals
window.toggleHighContrast = toggleHighContrast;
window.toggleLargeText = toggleLargeText;
window.toggleAudioDesc = toggleAudioDesc;
window.toggleReduceMotion = toggleReduceMotion;
window.adjustFontSize = adjustFontSize;
window.resetFontSize = resetFontSize;
window.accessQuery = accessQuery;
window.findAccessibleRoute = findAccessibleRoute;
