/**
 * @fileoverview Sustainability & Eco-Impact Module — FIFA WC 2026
 * @module sustainability
 * @description Provides carbon footprint calculation, personalized AI eco-tips,
 *              stadium energy metrics visualization, and sustainability tracking
 *              aligned with FIFA's Green Goal 2026 initiative.
 */

'use strict';

/* -------- Constants -------- */

/**
 * @const {number} TREE_CO2_KG_PER_YEAR
 * Average CO₂ absorbed by one mature tree per year in kilograms.
 * Source: EPA / IPCC guidelines.
 */
const TREE_CO2_KG_PER_YEAR = 21.77;

/** @const {number} Minimum eco metric value for the energy simulation */
const ECO_ENERGY_MIN = 60;

/** @const {number} Maximum eco metric value for the energy simulation */
const ECO_ENERGY_MAX = 85;

/** @const {number} Baseline energy meter start value (% renewable) */
const ECO_ENERGY_START = 67;

/** @const {number} IntersectionObserver threshold for metric bar animation */
const ECO_OBSERVER_THRESHOLD = 0.3;

/** @const {number} Energy simulation refresh interval in milliseconds */
const ECO_REFRESH_INTERVAL_MS = 5000;

/** @const {number} Maximum eco tips to display from AI response */
const MAX_ECO_TIPS = 5;

/** @const {number} Minimum response line length to be considered a valid tip */
const MIN_TIP_LINE_LENGTH = 15;

/**
 * @const {number} Low CO₂ threshold in kg — displayed in green.
 * Trips below this value are considered low-impact.
 */
const CO2_LOW_THRESHOLD = 2;

/**
 * @const {number} Medium CO₂ threshold in kg — displayed in amber.
 * Trips below this are medium-impact.
 */
const CO2_MED_THRESHOLD = 8;

/* -------- Data -------- */

/**
 * CO₂ emission factors in kg per km for each transport mode.
 * Based on IPCC AR6 transport lifecycle assessment data.
 *
 * @const {Object.<string, number>}
 */
const CARBON_EMISSION_FACTORS = {
  'fly-long':  0.255,
  'fly-short': 0.177,
  'drive':     0.192,
  'carpool':   0.048,
  'train':     0.041,
  'metro':     0.027,
  'walk':      0.000,
};

/**
 * Fallback eco tips used when the AI service is unavailable.
 * @const {string[]}
 */
const FALLBACK_ECO_TIPS = [
  '🌱 Use the stadium reusable cup program — saves 40g plastic per drink.',
  '♻️ Sort waste at color-coded bins: green (recycling), blue (compost).',
  '💧 Refill at free water stations — skip single-use plastic bottles.',
  '📱 Use your digital ticket — saves paper and speeds entry.',
];

/* -------- Private Helpers -------- */

/**
 * Determines the display colour for a CO₂ value.
 * @param {number} kgCO2 - Carbon footprint in kilograms
 * @returns {string} CSS colour value (hex)
 */
function _co2Colour(kgCO2) {
  if (kgCO2 <= CO2_LOW_THRESHOLD) return '#00c853';
  if (kgCO2 <= CO2_MED_THRESHOLD) return '#ffd600';
  return '#ff1744';
}

/**
 * Parses an AI text response into individual eco tip strings.
 * Filters lines by length and common tip-start characters.
 *
 * @private
 * @param {string} text - Raw AI response text
 * @returns {string[]} Array of up to MAX_ECO_TIPS tip strings
 */
function _parseEcoTips(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > MIN_TIP_LINE_LENGTH);

  const tipPattern = /^[\d\-\*•✅🌱♻️💧🌿]/;
  const tips = lines.filter(l => tipPattern.test(l) || l.length > 30);

  const candidates = tips.slice(0, MAX_ECO_TIPS);
  return candidates.length > 0 ? candidates : [text.substring(0, 300)];
}

/* -------- Public API -------- */

/**
 * Recalculates and displays the carbon footprint based on the
 * user's selected transport mode and travel distance.
 * Updates both the CO₂ value and tree-equivalent displays.
 */
function updateCarbon() {
  const transportMode = getEl('carbon-transport')?.value || 'metro';
  const rawDistance   = getEl('carbon-distance')?.value  || '50';
  const distance      = parseFloat(rawDistance);

  if (isNaN(distance) || distance <= 0) return;

  const factor   = CARBON_EMISSION_FACTORS[transportMode] ?? 0.1;
  const kgCO2    = (factor * distance).toFixed(2);
  const trees    = (kgCO2 / TREE_CO2_KG_PER_YEAR).toFixed(2);

  const carbonKgEl   = getEl('carbon-kg');
  const carbonTreeEl = getEl('carbon-trees');

  if (carbonKgEl) {
    carbonKgEl.textContent = kgCO2;
    carbonKgEl.style.color = _co2Colour(parseFloat(kgCO2));
  }

  if (carbonTreeEl) carbonTreeEl.textContent = trees;

  announceToScreenReader(
    `Carbon footprint: ${kgCO2} kilograms CO₂, equal to ${trees} trees per year.`
  );
}

/**
 * Fetches and renders AI-generated personalized eco tips based on
 * the user's transport mode and travel distance.
 * Falls back to curated static tips if the AI service is unavailable.
 * @returns {Promise<void>}
 */
async function getEcoTips() {
  const transportMode = getEl('carbon-transport')?.value || 'metro';
  const distance      = getEl('carbon-distance')?.value  || '50';
  const tipsList      = getEl('eco-tips-list');
  const btn           = getEl('eco-tips-btn');

  if (!tipsList) return;
  if (btn) btn.disabled = true;

  const loadingTip = document.createElement('div');
  loadingTip.className = 'eco-tip shimmer';
  loadingTip.setAttribute('aria-label', 'Loading eco tips');
  loadingTip.textContent = '🤖 Generating personalized tips…';
  tipsList.innerHTML = '';
  tipsList.appendChild(loadingTip);

  try {
    const prompt = [
      `Generate 4 specific, actionable eco tips for a FIFA WC 2026 fan`,
      `who traveled ${distance}km by ${transportMode}.`,
      `Include stadium sustainable actions, food choices, and waste reduction.`,
      `Quantify the impact of each tip where possible.`,
    ].join(' ');

    const response = await generateAIResponse(prompt, 'sustainability');
    const tips     = _parseEcoTips(response);

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
  } catch (_err) {
    tipsList.innerHTML = '';
    FALLBACK_ECO_TIPS.forEach(tip => {
      const div = document.createElement('div');
      div.className = 'eco-tip';
      div.setAttribute('role', 'listitem');
      div.textContent = tip;
      tipsList.appendChild(div);
    });
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * Triggers the CSS width animation on eco metric progress bars.
 * Called once when the sustainability section enters the viewport.
 */
function animateEcoMetrics() {
  qsa('.eco-bar-fill').forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = targetWidth; }, 100);
  });
}

/**
 * Initializes the sustainability module:
 * - Calculates initial carbon footprint
 * - Sets up IntersectionObserver for metric bar animations
 * - Starts the live energy metric simulation
 */
function initSustainability() {
  updateCarbon();

  // Animate bars when section enters viewport
  const sustainSection = getEl('sustain-module');
  if (sustainSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateEcoMetrics();
        observer.disconnect();
      }
    }, { threshold: ECO_OBSERVER_THRESHOLD });
    observer.observe(sustainSection);
  }

  // Simulate real-time renewable energy usage
  let energyVal = ECO_ENERGY_START;

  setInterval(() => {
    energyVal = Math.max(ECO_ENERGY_MIN, Math.min(ECO_ENERGY_MAX, energyVal + randomInt(-2, 2)));
    const energyFill  = getEl('energy-fill');
    const energyValEl = getEl('energy-val');

    if (energyFill)  energyFill.style.width    = `${energyVal}%`;
    if (energyValEl) energyValEl.textContent    = `${(2.4 + (energyVal - ECO_ENERGY_START) * 0.02).toFixed(1)} MW`;
  }, ECO_REFRESH_INTERVAL_MS);
}

/* -------- Global + Test Exports -------- */
window.updateCarbon = updateCarbon;
window.getEcoTips   = getEcoTips;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateCarbon };
}
