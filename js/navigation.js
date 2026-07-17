/**
 * @fileoverview Navigation Module — Stadium AI navigation & wayfinding
 * @module navigation
 */

'use strict';

/** Stadium zones configuration for map rendering */
const STADIUM_ZONES = [
  { id: 'zone-north', label: 'N Stand', density: 'high', x: '30%', y: '5%', w: '40%', h: '18%' },
  { id: 'zone-south', label: 'S Stand', density: 'low', x: '30%', y: '77%', w: '40%', h: '18%' },
  { id: 'zone-east', label: 'E Stand', density: 'med', x: '77%', y: '25%', w: '18%', h: '50%' },
  { id: 'zone-west', label: 'W Stand', density: 'low', x: '5%', y: '25%', w: '18%', h: '50%' },
  { id: 'zone-pitch', label: '⚽ Pitch', density: 'facility', x: '30%', y: '25%', w: '40%', h: '50%' },
];

/** Facility markers on the map */
const STADIUM_FACILITIES = [
  { id: 'fac-food-n', label: '🍕', title: 'Food Court North', x: '46%', y: '22%' },
  { id: 'fac-med', label: '🏥', title: 'Medical Station', x: '22%', y: '50%' },
  { id: 'fac-access', label: '♿', title: 'Accessible Entrance', x: '75%', y: '50%' },
  { id: 'fac-info', label: 'ℹ️', title: 'Info Desk', x: '46%', y: '78%' },
];

/** Quick navigation responses */
const QUICK_NAV_RESPONSES = {
  gate: '🚪 **Nearest Gate**: Gate B (East) is your closest entrance — 180m from your current location. Current wait time: 3 minutes. Gate D (West) is also open with a 7-minute wait.',
  parking: '🅿️ **Parking**: Lot P1 (North) has 340 available spaces. Lot P3 (East, accessible) has 45 accessible spaces remaining. GPS: Follow signs from Route 3. Shuttle from lots to Gate A runs every 5 minutes.',
  food: '🍕 **Food Courts**: Court F (South) — 2 min wait, halal & vegan options. Court A (North) — 12 min wait. Court C (East) — 6 min wait, family-friendly menu. Court B accepts cashless payments only.',
  medical: '🏥 **Medical Station**: Primary station at Section 118, Level 1 (Gate C area). Secondary at Section 312, Level 3. Both staffed 24/7 during events. For emergencies: alert any steward or dial stadium hotline.',
  accessible: '♿ **Accessible Facilities**: Elevator access at Gates A, B, C, D. Accessible restrooms every 50m on all levels. Wheelchair spaces in Sections 100, 200, 300. Assistance desk at Gate B (East).',
  fanzone: '🎉 **Fan Zone**: The official FIFA Fan Zone is in the South Plaza (Gate C area). Features live screens, merchandise, food, and cultural activations. Open 3 hours before kickoff. Current occupancy: 62%.',
};

/**
 * Renders the interactive stadium map with zone density indicators.
 */
function renderStadiumMap() {
  const mapEl = getEl('stadium-map');
  if (!mapEl) return;

  mapEl.innerHTML = '';

  // Render zones
  STADIUM_ZONES.forEach(zone => {
    const div = document.createElement('div');
    div.className = `map-zone zone-${zone.density}`;
    div.id = zone.id;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `${zone.label} — ${zone.density} crowd density`);
    div.setAttribute('data-tooltip', `${zone.label}: ${zone.density.charAt(0).toUpperCase() + zone.density.slice(1)} density`);
    div.style.cssText = `left:${zone.x};top:${zone.y};width:${zone.w};height:${zone.h};`;
    div.innerHTML = `<span>${zone.label}</span>`;
    div.addEventListener('click', () => onZoneClick(zone));
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') onZoneClick(zone); });
    mapEl.appendChild(div);
  });

  // Render facilities
  STADIUM_FACILITIES.forEach(fac => {
    const div = document.createElement('div');
    div.className = 'map-facility';
    div.id = fac.id;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', fac.title);
    div.setAttribute('data-tooltip', fac.title);
    div.style.cssText = `left:${fac.x};top:${fac.y};`;
    div.textContent = fac.label;
    div.addEventListener('click', () => onFacilityClick(fac));
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') onFacilityClick(fac); });
    mapEl.appendChild(div);
  });
}

/**
 * Handles zone click on the stadium map.
 * @param {Object} zone - Zone configuration object
 */
function onZoneClick(zone) {
  const query = `What is the current status and best way to reach ${zone.label}?`;
  fillNavQuery(query);
  announceToScreenReader(`Selected ${zone.label}. Query loaded in chat input.`);
}

/**
 * Handles facility click on the stadium map.
 * @param {Object} fac - Facility configuration object
 */
function onFacilityClick(fac) {
  const query = `Where exactly is ${fac.title} and how do I get there?`;
  fillNavQuery(query);
  announceToScreenReader(`Selected ${fac.title}. Query loaded in chat input.`);
}

/**
 * Pre-fills the navigation query input with a suggested question.
 * @param {string} query - The query to pre-fill
 */
function fillNavQuery(query) {
  const input = getEl('nav-query');
  if (input) {
    input.value = query;
    input.focus();
  }
}

/**
 * Handles the navigation chat form submission.
 * @param {Event} e - Form submit event
 */
async function handleNavSubmit(e) {
  e.preventDefault();
  const input = getEl('nav-query');
  if (!input) return;

  const query = sanitizeInput(input.value);
  if (!query) return;

  const messagesEl = getEl('nav-chat-messages');
  if (!messagesEl) return;

  // Add user message
  addChatMessage(messagesEl, query, 'user');
  input.value = '';
  input.focus();

  // Add typing indicator
  const typingEl = addTypingIndicator(messagesEl);

  try {
    const response = await generateAIResponse(query, 'navigation');
    typingEl.remove();
    addChatMessage(messagesEl, response, 'ai');
    announceToScreenReader('Navigation AI responded to your query.');
  } catch (err) {
    typingEl.remove();
    addChatMessage(messagesEl, '⚠️ Navigation service temporarily unavailable. Please contact the nearest info desk.', 'ai');
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Handles quick navigation button clicks.
 * @param {string} type - Navigation type key
 */
async function quickNav(type) {
  const messagesEl = getEl('nav-chat-messages');
  if (!messagesEl) return;

  const response = QUICK_NAV_RESPONSES[type];
  if (!response) return;

  addChatMessage(messagesEl, `Quick navigation: ${type}`, 'user');

  const typingEl = addTypingIndicator(messagesEl);

  await new Promise(r => setTimeout(r, 600));
  typingEl.remove();

  addChatMessage(messagesEl, response, 'ai');
  messagesEl.scrollTop = messagesEl.scrollHeight;
  announceToScreenReader(`Navigation info for ${type} loaded.`);
}

/**
 * Adds a chat message to the messages container.
 * @param {HTMLElement} container - Messages container
 * @param {string} text - Message text (may contain markdown)
 * @param {'user'|'ai'} role - Message sender role
 */
function addChatMessage(container, text, role) {
  const div = document.createElement('div');
  div.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
  div.setAttribute('role', 'listitem');

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = _formatMessageText(text);

  div.appendChild(avatar);
  div.appendChild(content);
  container.appendChild(div);
}

/**
 * Adds a typing indicator to the chat.
 * @param {HTMLElement} container - Messages container
 * @returns {HTMLElement} The typing indicator element
 */
function addTypingIndicator(container) {
  const div = document.createElement('div');
  div.className = 'chat-message ai-message';
  div.setAttribute('role', 'listitem');
  div.setAttribute('aria-label', 'AI is typing');
  div.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🤖</div>
    <div class="message-content">
      <div class="ai-typing visible" aria-label="Processing">
        <span class="typing-dot" aria-hidden="true"></span>
        <span class="typing-dot" aria-hidden="true"></span>
        <span class="typing-dot" aria-hidden="true"></span>
      </div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

/**
 * Formats message text with basic markdown and sanitization.
 * @private
 * @param {string} text
 * @returns {string} HTML string
 */
function _formatMessageText(text) {
  const safe = sanitizeHTML(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

/**
 * Initializes the navigation module.
 */
function initNavigation() {
  renderStadiumMap();

  const form = getEl('nav-chat-form');
  if (form) form.addEventListener('submit', handleNavSubmit);

  const venueSelect = getEl('venue-select');
  if (venueSelect) {
    venueSelect.addEventListener('change', (e) => {
      showToast(`Switched to ${e.target.options[e.target.selectedIndex].text}`, 'info');
      renderStadiumMap();
    });
  }
}

// Expose globals for inline handlers
window.fillNavQuery = fillNavQuery;
window.quickNav = quickNav;
