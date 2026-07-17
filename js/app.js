/**
 * @fileoverview Main Application Controller — FIFA WC 2026 GenAI Stadium Hub
 * @module app
 * @description Orchestrates all modules, handles theme/language switching,
 *              API activation, hero particles, and navigation active states.
 */

'use strict';

/* ========== AI Activation ========== */

/**
 * Activates the Gemini AI with the provided API key.
 */
async function activateAI() {
  const keyInput = getEl('gemini-api-key');
  const statusEl = getEl('api-status');
  const btn = getEl('activate-ai-btn');

  if (!keyInput || !statusEl) return;

  const key = keyInput.value.trim();
  if (!key) {
    showToast('⚠️ Please enter a Gemini API key', 'warning');
    return;
  }

  if (btn) btn.disabled = true;
  if (statusEl) { statusEl.textContent = '⏳ Activating...'; statusEl.className = 'api-status'; }

  const success = await activateAIEngine(key);

  if (success) {
    statusEl.textContent = '✅ AI Active';
    statusEl.className = 'api-status success';
    keyInput.value = '';
    showToast('🤖 Gemini AI activated! All modules now use real AI responses.', 'success', 5000);
    announceToScreenReader('Gemini AI activated successfully. All modules now use live AI.');
    getEl('api-setup-banner')?.classList.add('activated');
  } else {
    statusEl.textContent = '❌ Invalid key';
    statusEl.className = 'api-status error';
    showToast('❌ Invalid API key format. Get a free key at ai.google.dev', 'error', 5000);
    announceToScreenReader('Invalid API key. Please try again.', 'assertive');
  }

  if (btn) btn.disabled = false;
}

/* ========== Theme Toggle ========== */

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);

  const icon = getEl('theme-icon');
  if (icon) icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';

  sessionSet('theme', newTheme);
  announceToScreenReader(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated.`);
  showToast(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} theme activated`, 'info', 2000);
}

/* ========== Mobile Navigation ========== */

/**
 * Toggles the mobile navigation menu.
 */
function toggleMobileNav() {
  const menu = getEl('nav-menu');
  const toggle = getEl('nav-toggle');
  if (!menu || !toggle) return;

  const isOpen = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  announceToScreenReader(isOpen ? 'Navigation menu opened.' : 'Navigation menu closed.');
}

/* ========== Active Nav Link on Scroll ========== */

/**
 * Sets up scroll-based active navigation link highlighting.
 */
function setupScrollSpy() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

  sections.forEach(section => observer.observe(section));
}

/* ========== Hero Particles ========== */

/**
 * Creates animated floating particles in the hero section.
 */
function initHeroParticles() {
  const container = getEl('hero-particles');
  if (!container) return;

  // Respect reduce motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COUNT = 20;
  const colors = ['#00d4aa', '#7c4dff', '#ffd600', '#ffffff'];

  for (let i = 0; i < COUNT; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = randomInt(3, 8);
    const color = randomPick(colors);
    const left = randomInt(0, 100);
    const duration = randomInt(8, 20);
    const delay = randomInt(0, 10);

    particle.style.cssText = `
      width:${size}px;
      height:${size}px;
      left:${left}%;
      background:${color};
      opacity:${(Math.random() * 0.4 + 0.1).toFixed(2)};
      animation-duration:${duration}s;
      animation-delay:-${delay}s;`;
    container.appendChild(particle);
  }
}

/* ========== Language Quick Select ========== */

/**
 * Handles the global quick language selection.
 * @param {string} lang - Language code
 */
function handleLangChange(lang) {
  const langNames = {
    en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic', pt: 'Portuguese',
    de: 'German', zh: 'Chinese', ja: 'Japanese', hi: 'Hindi', ko: 'Korean',
  };

  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }

  // Sync phrasebook
  const phraseLangEl = getEl('phrase-lang');
  if (phraseLangEl && phraseLangEl.querySelector(`option[value="${lang}"]`)) {
    phraseLangEl.value = lang;
    loadPhrases(lang);
  }

  showToast(`🌐 Interface language: ${langNames[lang] || lang}`, 'info', 2000);
  announceToScreenReader(`Language changed to ${langNames[lang] || lang}.`);
}

/* ========== AI Demo ========== */

/**
 * Triggers a demo of AI capabilities across modules.
 */
async function startAIDemo() {
  showToast('🤖 Starting AI demo — watch the navigation chat!', 'info', 3000);

  // Scroll to navigation and trigger demo query
  const navSection = getEl('navigation-module');
  if (navSection) {
    navSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await new Promise(r => setTimeout(r, 800));
    fillNavQuery('Show me the fastest route to my seat and what food options are near Section 115');

    const form = getEl('nav-chat-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
}

/* ========== Smooth scroll for nav links ========== */
function setupSmoothScrollLinks() {
  qsa('.nav-link, .footer-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = getEl(href.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Close mobile nav if open
          const menu = getEl('nav-menu');
          if (menu) {
            menu.classList.remove('open');
            getEl('nav-toggle')?.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
}

/* ========== Restore User Preferences ========== */
function restorePreferences() {
  const savedTheme = sessionGet('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = getEl('theme-icon');
    if (icon) icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }
}

/* ========== App Initialization ========== */

/**
 * Main app entry point. Initializes all modules sequentially.
 */
function initApp() {
  restorePreferences();
  initHeroParticles();
  setupScrollSpy();
  setupSmoothScrollLinks();

  // Initialize all feature modules
  initNavigation();
  initCrowd();
  initAccessibility();
  initTransport();
  initSustainability();
  initMultilingual();
  initOperations();
  initDecisions();

  // Wire up global controls
  const themeBtn = getEl('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const navToggle = getEl('nav-toggle');
  if (navToggle) navToggle.addEventListener('click', toggleMobileNav);

  const quickLang = getEl('quick-lang');
  if (quickLang) quickLang.addEventListener('change', (e) => handleLangChange(e.target.value));

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    const menu = getEl('nav-menu');
    const toggle = getEl('nav-toggle');
    if (menu && !menu.contains(e.target) && !toggle?.contains(e.target)) {
      menu.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle keyboard escape to close overlays
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const menu = getEl('nav-menu');
      if (menu?.classList.contains('open')) {
        menu.classList.remove('open');
        getEl('nav-toggle')?.setAttribute('aria-expanded', 'false');
        getEl('nav-toggle')?.focus();
      }
      hideLoading();
    }
  });

  console.info('🏟️ FIFA WC 2026 GenAI Stadium Hub initialized successfully');
  announceToScreenReader('FIFA World Cup 2026 GenAI Stadium Hub loaded. Navigate using the main menu.');
}

// Expose globals
window.activateAI = activateAI;
window.startAIDemo = startAIDemo;

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
