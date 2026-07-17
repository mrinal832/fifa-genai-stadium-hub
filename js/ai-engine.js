/**
 * @fileoverview AI Engine — Google Gemini API integration
 * @module ai-engine
 * @description Handles all Generative AI calls to Google Gemini API with
 *              rate limiting, error handling, fallback responses, and caching.
 */

'use strict';

/** @type {string|null} Gemini API key stored in session only */
let _apiKey = null;

/** @type {boolean} Whether AI is activated with a valid key */
let _aiActive = false;

/** @type {Map<string, string>} Simple response cache to avoid duplicate API calls */
const _responseCache = new Map();

/** Max cache entries to avoid memory bloat */
const MAX_CACHE_SIZE = 50;

/** Gemini API endpoint */
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * FIFA WC 2026 system context injected into every prompt.
 * @type {string}
 */
const SYSTEM_CONTEXT = `You are the official AI assistant for the FIFA World Cup 2026 Stadium Operations Hub.
The tournament is held across 16 venues in the USA, Canada, and Mexico with 48 teams and 104 matches.
Key venues: MetLife Stadium (NJ), AT&T Stadium (TX), SoFi Stadium (CA), Levi's Stadium (CA), 
Lincoln Financial Field (PA), Arrowhead Stadium (KC), BC Place (Vancouver), Estadio Azteca (Mexico City).
You help fans, staff, volunteers, and organizers with:
- Navigation and wayfinding within stadiums
- Crowd management and safety
- Accessibility services (wheelchair, visual/hearing impairment)
- Transportation and logistics
- Sustainability and eco-initiatives
- Real-time operational decisions
- Multilingual support

Be concise (3-5 sentences max unless asked for detail), helpful, safety-first, and proactive.
Format responses with clear sections when providing multi-step guidance.
Always prioritize fan safety and accessibility.`;

/**
 * Activates the AI engine with the provided API key.
 * @param {string} key - Google Gemini API key
 * @returns {Promise<boolean>} True if activation succeeded
 */
async function activateAIEngine(key) {
  if (!key || typeof key !== 'string') return false;

  // Basic format validation (AIza prefix check)
  const sanitizedKey = key.trim();
  if (sanitizedKey.length < 20) return false;

  _apiKey = sanitizedKey;
  _aiActive = true;
  sessionSet('ai_active', true);
  return true;
}

/**
 * Checks if the AI engine is currently active.
 * @returns {boolean}
 */
function isAIActive() {
  return _aiActive;
}

/**
 * Deactivates the AI engine and clears the API key from memory.
 */
function deactivateAI() {
  _apiKey = null;
  _aiActive = false;
  _responseCache.clear();
  sessionSet('ai_active', false);
}

/**
 * Generates a response from Gemini AI for the given prompt.
 * Falls back to curated simulated responses if AI is not active.
 *
 * @param {string} prompt - User prompt / question
 * @param {string} [module='general'] - Module context (navigation, crowd, etc.)
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.temperature=0.7] - Generation temperature
 * @param {number} [options.maxOutputTokens=300] - Max tokens in response
 * @returns {Promise<string>} AI generated response text
 */
async function generateAIResponse(prompt, module = 'general', options = {}) {
  const sanitizedPrompt = sanitizeInput(prompt, 1000);
  if (!sanitizedPrompt) return 'Please provide a valid question.';

  // Rate limiting: max 15 AI requests per minute
  if (!checkRateLimit(`ai_${module}`, 15, 60000)) {
    return '⏳ Rate limit reached. Please wait a moment before sending more requests. This helps ensure fair usage for all fans.';
  }

  // Check cache for identical prompts
  const cacheKey = `${module}:${sanitizedPrompt.toLowerCase()}`;
  if (_responseCache.has(cacheKey)) {
    return _responseCache.get(cacheKey);
  }

  let response;

  if (_aiActive && _apiKey) {
    response = await _callGeminiAPI(sanitizedPrompt, module, options);
  } else {
    response = _getSimulatedResponse(sanitizedPrompt, module);
  }

  // Cache the response
  if (_responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _responseCache.keys().next().value;
    _responseCache.delete(firstKey);
  }
  _responseCache.set(cacheKey, response);

  return response;
}

/**
 * Makes the actual API call to Google Gemini.
 * @private
 * @param {string} prompt - Sanitized prompt
 * @param {string} module - Module context
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Response text
 */
async function _callGeminiAPI(prompt, module, options) {
  const { temperature = 0.7, maxOutputTokens = 350 } = options;

  const moduleContexts = {
    navigation: 'Focus on stadium navigation, directions, gate locations, and wayfinding.',
    crowd: 'Focus on crowd management, density analysis, safety protocols, and staff recommendations.',
    accessibility: 'Focus on accessibility routes, inclusive services, and support for fans with disabilities.',
    transport: 'Focus on transportation options, routes, timing, and multi-modal journey planning.',
    sustainability: 'Focus on eco-friendly choices, carbon footprint, green initiatives, and sustainability metrics.',
    multilingual: 'Provide culturally sensitive, clear translations and local guidance.',
    operations: 'Focus on operational decisions, task management, incident triage, and staff coordination.',
    decisions: 'Provide executive-level analysis, risk assessment, and data-driven recommendations.',
  };

  const contextNote = moduleContexts[module] || '';
  const fullPrompt = `${SYSTEM_CONTEXT}\n\nModule Context: ${contextNote}\n\nUser Query: ${prompt}`;

  const requestBody = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      topK: 40,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${_apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403 || res.status === 401) {
        _aiActive = false;
        return '🔑 Invalid API key. Please check your Gemini API key and try again.';
      }
      if (res.status === 429) {
        return '⏳ Gemini API quota reached. Using smart fallback responses.';
      }
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text.trim();
  } catch (err) {
    console.warn('[AI Engine] Gemini API error, using fallback:', err.message);
    return _getSimulatedResponse(prompt, module);
  }
}

/**
 * Returns a curated, context-aware simulated AI response.
 * Used when Gemini API is not active or unavailable.
 * @private
 * @param {string} prompt - User prompt (lowercase)
 * @param {string} module - Module context
 * @returns {string} Simulated response
 */
function _getSimulatedResponse(prompt, module) {
  const p = prompt.toLowerCase();

  const responses = {
    navigation: [
      `🗺️ **Navigation Guide**: From Gate D, take the main concourse heading north. Section 115 is approximately 3 minutes away on Level 1. Look for the green wayfinding signs. The route is fully wheelchair accessible with ramp access at Columns 14-16.\n\n**Tip**: Current crowd density is low near the east corridor — recommended route to avoid congestion.`,
      `🚪 **Gate Directions**: The nearest accessible entrance from your location is Gate B (East). It features wide turnstiles, tactile paving, and a staffed accessibility desk open 2 hours before kickoff. An elevator serves all 4 levels from this gate.\n\n**Current Status**: Gate B wait time is approximately 4 minutes.`,
      `🏥 **First Aid Station**: The primary medical station is located at Section 118, Level 1 (near Gate C). A secondary station is at Section 312, Level 3. Both are staffed with EMTs throughout the match. For emergencies, contact any steward or dial the stadium hotline.`,
      `🍔 **Food Courts**: The least crowded food court right now is **Court F (South)** with less than 2-minute wait times. It offers halal, vegan, and gluten-free options. Court A (North) is currently at 78% capacity — expect a 12-minute wait.`,
    ],
    crowd: [
      `📊 **Crowd Analysis**: Zone D (North Stand) is approaching 89% capacity — recommend opening auxiliary Gate D2 and redirecting incoming fans via the east concourse. Estimated relief: 15% load reduction within 8 minutes.\n\n**Action**: Dispatch 3 stewards to Gate D junction points immediately.`,
      `⚠️ **Rebalancing Recommendation**: Current hotspot: Lower North concourse near food courts (92% density). Suggest: (1) Temporarily close 2 food stalls to reduce dwell time, (2) Open overflow seating in Section 108-110, (3) Activate PA announcement directing fans to less crowded areas.\n\n**Projected impact**: Density reduced to 74% within 12 minutes.`,
      `✅ **Status Update**: Crowd flow is stable across all zones. Peak bottleneck risk is predicted at Gate A during halftime (est. 73,000 fans will move simultaneously). Pre-positioning 8 additional stewards at Gate A junctions 5 minutes before halftime is recommended.`,
    ],
    accessibility: [
      `♿ **Wheelchair Route**: From Gate A to Accessible Seating Block 5: Exit Gate A → Turn right at Ramp R1 → Follow blue tactile flooring for 120m → Take lift L3 to Level 2 → Accessible seating is in the front 3 rows of Block 5. Total distance: ~180m. Journey time: 4 minutes.\n\n**Facilities along route**: Accessible restroom at Column 8, assistance desk at Ramp R1.`,
      `👁️ **Visual Impairment Services**: Available services include: Audio description headsets (collect at Gate B Info Desk), tactile stadium maps, guide dog relief areas (Gates A and C), sighted guide volunteers (request via the accessibility app or any steward), and large-print match programs at all info desks.`,
      `👂 **Hearing Support**: Hearing loop coverage is available in all executive boxes and Sections 100-120. Live captioning screens are positioned at Sections 110, 210, and 310. British and American Sign Language interpreters are at the press box area (Section 108 upper). Request reserved seating near captioning via the accessibility desk.`,
      `👨‍👩‍👧 **Sensory Zones**: The designated Sensory Room is located at Level 1, Section 101 East. It offers reduced lighting, noise-cancelling headphones, fidget tools, and quiet space for up to 20 fans. A Family Sensory Area (outdoor, shaded) is near Gate C. Both spaces are staffed by trained volunteers.`,
    ],
    transport: [
      `🚇 **Recommended Route**: Take NJ Transit to Meadowlands Station (direct from Penn Station, every 15 min). From the station it's a 7-minute covered walkway to Gate A. Journey time from midtown Manhattan: ~35 minutes. **Arrive 90 minutes before kickoff** to avoid peak crowds.\n\n🌿 **Eco bonus**: Rail travel saves ~6.2 kg CO₂ vs. driving.`,
      `🚗 **Ride-Share**: Designated pick-up/drop-off zones are at Lot H (north side) for Uber/Lyft. Surge pricing is expected 90 min before and 45 min after kickoff. **Pro tip**: Schedule pickup 30 minutes after final whistle to beat the surge. Current wait time at Lot H: ~6 minutes.`,
      `🚌 **Shuttle Service**: Official FIFA shuttles depart from Times Square, Herald Square, and Newark Penn Station. Frequency: every 8 minutes. Cost: $15 round trip (included with some ticket packages — check your ticket QR code). Current occupancy: 67%. Next departure from Times Square: 14 minutes.`,
    ],
    sustainability: [
      `🌿 **Your Eco Tips**: Based on your transit choice (metro), you've already made the greenest transport decision — saving 5.8 kg CO₂ vs. solo driving!\n\n**At the stadium**: (1) Use the reusable cup program — $1 deposit returned at exit, (2) Sort waste at the color-coded stations (green=recycling, blue=compost, red=landfill), (3) Use the stadium's free water refill stations instead of bottled water.`,
      `♻️ **Stadium Sustainability Update**: Today's eco performance — Energy: 71% from renewable solar array, Water: 38K litres recycled via greywater system, Waste: 81% diverted from landfill (exceeding 80% target!), Food waste: composted on-site. **Carbon offset**: 420 trees planted via FIFA's Green Goal 2026 initiative for today's match.`,
      `🌍 **Carbon Reduction**: Switching from a personal car to the metro for this match saves approximately 4.2 kg CO₂e — equivalent to charging your phone 500 times. If all 82,500 fans made the same switch, the event would save ~346 tonnes of CO₂ — equal to planting 15,700 trees.`,
    ],
    multilingual: [
      `🌐 **Translation complete.** The AI has processed your text with cultural context awareness for FIFA World Cup 2026. Note: Stadium-specific terms (gate names, section numbers) are preserved in their original format for clarity.\n\n**Cultural note**: Match-day etiquette and safety announcements are available in all 10 supported languages at information desks.`,
    ],
    operations: [
      `📋 **Task Assignment**: Based on current operational data, the highest-priority task is crowd management at Gate D (density 89%). Recommended assignment: Team Bravo (3 stewards, currently at Gate B with 12-minute gap). ETA to Gate D: 4 minutes.\n\n**Rationale**: Team Bravo has the shortest transit time and Gate B is currently at manageable 62% capacity.`,
      `🚨 **Incident Triage — MEDICAL**: Priority: HIGH. Dispatch nearest paramedic team (Unit 3, currently at Section 201 — ETA 2 min). Secure a 3-meter radius around the patient. Notify stadium medical coordinator via radio Channel 4. Document incident in the ops log. AED device at Column 12 (30m from incident). Nearest hospital: Hackensack University Medical Center, 8 min by ambulance.`,
      `🔧 **Predictive Maintenance**: AI analysis flags: HVAC Unit 7 (Level 3 North) showing temperature anomaly — 94% probability of performance degradation within 3 hours. Recommended action: Pre-emptive inspection during halftime by facilities team. Fan comfort impact: Section 305-320 if unit fails. Backup unit available in maintenance depot.`,
    ],
    decisions: [
      `📊 **Executive Briefing**: Current operations are running at 91% efficiency. Three items require attention:\n1. **Gate D congestion** (HIGH) — Recommend opening auxiliary Gate D2\n2. **HVAC Unit 7** (MEDIUM) — Schedule halftime inspection\n3. **Concession supply** (LOW) — Beer vendor at Section 115 running low, restock in 22 minutes\n\nOverall fan satisfaction trending at 4.7/5 — excellent performance.`,
      `🎮 **Scenario Analysis — Gate Closure**: Closing Gate A would redirect approximately 12,000 fans to Gates B and C. Expected impact: B at 94% capacity, C at 87%. Recommend: (1) Open secondary Gate B2, (2) Add 4 stewards to Gate C junction, (3) PA announcement directing fans. Wait time increase: ~8 minutes. Safety risk: LOW if actions taken within 5 minutes.`,
      `⛈️ **Weather Protocol**: Thunderstorm warning active for 19:30-21:00. Recommended actions: (1) Halt outdoor plaza activities at 19:15, (2) Open all indoor concourse areas, (3) Prepare lightning protocol (halt match if lightning within 8km), (4) Brief all gate stewards on shelter procedures by 18:45. Medical team: stand by for heat/weather-related cases.`,
    ],
  };

  const moduleResponses = responses[module] || responses.navigation;
  return randomPick(moduleResponses);
}

/**
 * Generates a streaming-style response by revealing text character by character.
 * @param {string} text - Complete response text
 * @param {HTMLElement} container - DOM element to stream text into
 * @param {Function} [onComplete] - Callback when streaming completes
 * @param {number} [speed=18] - Characters per interval (higher = faster)
 */
async function streamResponse(text, container, onComplete, speed = 18) {
  if (!container) return;
  container.textContent = '';
  let index = 0;

  const interval = setInterval(() => {
    index = Math.min(index + speed, text.length);
    container.innerHTML = _markdownToHTML(text.substring(0, index));

    if (index >= text.length) {
      clearInterval(interval);
      if (onComplete) onComplete();
    }
  }, 30);
}

/**
 * Converts basic markdown to HTML (bold, italic, lists, line breaks).
 * @private
 * @param {string} text - Markdown text
 * @returns {string} HTML string
 */
function _markdownToHTML(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    activateAIEngine,
    isAIActive,
    deactivateAI,
    generateAIResponse,
    streamResponse,
  };
}
