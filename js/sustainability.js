/**
 * @fileoverview Sustainability Module
 * @module sustainability
 */

'use strict';

const CARBON_EMISSION_FACTORS = {
  'fly-long': 0.255,
  'fly-short': 0.177,
  'drive': 0.192,
  'carpool': 0.048,
  'train': 0.041,
  'metro': 0.027,
  'walk': 0.000,
};

/**
 * Updates the carbon footprint calculation.
 */
function updateCarbon() {
  const transportMode = getEl('carbon-transport')?.value || 'metro';
  const distance = parseFloat(getEl('carbon-distance')?.value || 50);

  if (isNaN(distance) || distance <= 0) return;

  const factor = CARBON_EMISSION_FACTORS[transportMode] ?? 0.1;
  const kgCO2 = (factor * distance).toFixed(2);
  const trees = (kgCO2 / 21.77).toFixed(2); // avg tree absorbs ~21.77 kg CO2/year

  const carbonKgEl = getEl('carbon-kg');
  const carbonTreeEl = getEl('carbon-trees');

  if (carbonKgEl) carbonKgEl.textContent = kgCO2;
  if (carbonTreeEl) carbonTreeEl.textContent = trees;

  const resultEl = qs('.carbon-result');
  if (resultEl) {
    const color = kgCO2 <= 2 ? '#00c853' : kgCO2 <= 8 ? '#ffd600' : '#ff1744';
    if (carbonKgEl) carbonKgEl.style.color = color;
  }

  announceToScreenReader(`Carbon footprint: ${kgCO2} kilograms CO2 equivalent, equal to ${trees} trees per year.`);
}

/**
 * Fetches AI-generated personalized eco tips.
 */
async function getEcoTips() {
  const transportMode = getEl('carbon-transport')?.value || 'metro';
  const distance = getEl('carbon-distance')?.value || '50';
  const tipsList = getEl('eco-tips-list');
  const btn = getEl('eco-tips-btn');

  if (!tipsList) return;
  if (btn) btn.disabled = true;

  tipsList.innerHTML = `<div class="eco-tip shimmer" aria-label="Loading eco tips">🤖 Generating personalized tips...</div>`;

  try {
    const prompt = `Generate 4 specific, actionable eco tips for a FIFA WC 2026 fan who traveled ${distance}km by ${transportMode}. Include stadium-specific sustainable actions, food choices, and waste reduction tips. Make each tip practical and quantify the impact where possible.`;
    const response = await generateAIResponse(prompt, 'sustainability');

    const tips = _parseEcoTips(response);
    tipsList.innerHTML = '';
    tips.forEach((tip, i) => {
      const div = document.createElement('div');
      div.className = 'eco-tip';
      div.setAttribute('role', 'listitem');
      div.style.animationDelay = `${i * 0.1}s`;
      div.innerHTML = sanitizeHTML(tip).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      tipsList.appendChild(div);
    });

    announceToScreenReader(`${tips.length} eco tips generated for you.`);
  } catch (_) {
    tipsList.innerHTML = `
      <div class="eco-tip" role="listitem">🌱 Use the stadium's reusable cup program — saves 40g plastic per drink.</div>
      <div class="eco-tip" role="listitem">♻️ Sort waste at color-coded bins: green (recycling), blue (compost).</div>
      <div class="eco-tip" role="listitem">💧 Refill at free water stations — skip single-use plastic bottles.</div>
      <div class="eco-tip" role="listitem">📱 Use your digital ticket — saves paper and speeds entry.</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * Parses AI response into individual tip strings.
 * @private
 * @param {string} text
 * @returns {string[]}
 */
function _parseEcoTips(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  const tips = lines.filter(l => /^[\d\-\*•✅🌱♻️💧🌿]/.test(l) || l.length > 30);
  return tips.slice(0, 5).length > 0 ? tips.slice(0, 5) : [text.substring(0, 300)];
}

/**
 * Animates eco metric bars on scroll.
 */
function animateEcoMetrics() {
  const bars = qsa('.eco-bar-fill');
  bars.forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = targetWidth; }, 100);
  });
}

/**
 * Initializes the sustainability module.
 */
function initSustainability() {
  updateCarbon();

  // Animate bars when section comes into view
  const sustainSection = getEl('sustain-module');
  if (sustainSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateEcoMetrics();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(sustainSection);
  }

  // Live eco metric counter simulation
  let energyVal = 67;
  setInterval(() => {
    energyVal = Math.max(60, Math.min(85, energyVal + randomInt(-2, 2)));
    const energyFill = getEl('energy-fill');
    if (energyFill) energyFill.style.width = `${energyVal}%`;
    const energyValEl = getEl('energy-val');
    if (energyValEl) energyValEl.textContent = `${(2.4 + (energyVal - 67) * 0.02).toFixed(1)} MW`;
  }, 5000);
}

// Expose globals
window.updateCarbon = updateCarbon;
window.getEcoTips = getEcoTips;

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateCarbon
  };
}
