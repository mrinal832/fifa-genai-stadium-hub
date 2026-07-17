/**
 * @fileoverview Utility functions for FIFA WC 2026 GenAI Stadium Hub
 * @module utils
 * @description Shared utility functions: DOM helpers, sanitization, debounce,
 *              rate limiting, toast notifications, and accessibility helpers.
 */

'use strict';

/* -------- Input Sanitization (Security) -------- */

/**
 * Sanitizes a string to prevent XSS attacks by escaping HTML special characters.
 * @param {string} str - The raw input string
 * @returns {string} The sanitized string safe for DOM insertion
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return str.replace(/[&<>"'/]/g, (s) => map[s]);
}

/**
 * Sanitizes user input by removing dangerous patterns and trimming whitespace.
 * @param {string} input - Raw user input
 * @param {number} [maxLength=500] - Maximum allowed length
 * @returns {string} Sanitized input string
 */
function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+=/gi, ''); // Strip event handlers
}

/* -------- DOM Utilities -------- */

/**
 * Shorthand for document.getElementById with null guard.
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function getEl(id) {
  return document.getElementById(id);
}

/**
 * Shorthand for document.querySelector with null guard.
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Root element
 * @returns {Element|null}
 */
function qs(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll.
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Root element
 * @returns {NodeList}
 */
function qsa(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Sets the text content of an element safely.
 * @param {string} id - Element ID
 * @param {string} text - Text content to set
 */
function setText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = sanitizeHTML(text);
}

/**
 * Sets inner HTML of an element (use only with trusted/sanitized content).
 * @param {string} id - Element ID
 * @param {string} html - HTML content to set
 */
function setHTML(id, html) {
  const el = getEl(id);
  if (el) el.innerHTML = html;
}

/**
 * Shows an element by removing the 'hidden' attribute.
 * @param {string|HTMLElement} elOrId - Element or its ID
 */
function showEl(elOrId) {
  const el = typeof elOrId === 'string' ? getEl(elOrId) : elOrId;
  if (el) el.removeAttribute('hidden');
}

/**
 * Hides an element by setting the 'hidden' attribute.
 * @param {string|HTMLElement} elOrId - Element or its ID
 */
function hideEl(elOrId) {
  const el = typeof elOrId === 'string' ? getEl(elOrId) : elOrId;
  if (el) el.setAttribute('hidden', '');
}

/* -------- Performance Utilities -------- */

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Creates a throttled version of a function.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/* -------- Rate Limiter (Security) -------- */

/** @type {Map<string, {count: number, resetAt: number}>} */
const _rateLimitStore = new Map();

/**
 * Simple in-memory rate limiter to prevent abuse of AI endpoints.
 * @param {string} key - Unique key (e.g., user action type)
 * @param {number} [maxRequests=10] - Max requests allowed in the window
 * @param {number} [windowMs=60000] - Time window in milliseconds
 * @returns {boolean} True if request is allowed, false if rate limited
 */
function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    _rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/* -------- Toast Notifications -------- */

/**
 * Displays a toast notification.
 * @param {string} message - Notification message
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Toast type
 * @param {number} [duration=4000] - Duration in ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = getEl('toast-container');
  if (!container) return;

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span aria-hidden="true">${icons[type] || 'ℹ️'}</span><span>${sanitizeHTML(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* -------- Accessibility Utilities -------- */

/**
 * Announces a message to screen readers via the ARIA live region.
 * @param {string} message - Message to announce
 * @param {'polite'|'assertive'} [priority='polite'] - Announcement priority
 */
function announceToScreenReader(message, priority = 'polite') {
  const regionId = priority === 'assertive' ? 'aria-alert-region' : 'aria-live-region';
  const region = getEl(regionId);
  if (!region) return;

  // Clear then set to ensure re-announcement
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Traps keyboard focus within a modal or dialog element.
 * @param {HTMLElement} container - The container to trap focus within
 * @returns {Function} Cleanup function to remove the trap
 */
function trapFocus(container) {
  const focusableSelectors = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const focusable = Array.from(container.querySelectorAll(focusableSelectors));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  container.addEventListener('keydown', handler);
  if (first) first.focus();
  return () => container.removeEventListener('keydown', handler);
}

/* -------- Loading Overlay -------- */

/**
 * Shows the global loading overlay with optional message.
 * @param {string} [message='Processing with AI...'] - Loading message
 */
function showLoading(message = 'Processing with AI...') {
  const overlay = getEl('loading-overlay');
  const text = getEl('loading-text');
  if (overlay) { overlay.removeAttribute('hidden'); }
  if (text) text.textContent = message;
  announceToScreenReader(message);
}

/**
 * Hides the global loading overlay.
 */
function hideLoading() {
  const overlay = getEl('loading-overlay');
  if (overlay) overlay.setAttribute('hidden', '');
}

/* -------- Format Utilities -------- */

/**
 * Formats a timestamp to a locale-friendly time string.
 * @param {Date} [date=new Date()] - The date to format
 * @returns {string} Formatted time string
 */
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Formats a number with comma separators.
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  return n.toLocaleString('en-US');
}

/* -------- Session Storage (safe wrappers) -------- */

/**
 * Safely sets a value in sessionStorage.
 * @param {string} key
 * @param {*} value
 */
function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (_) { /* storage unavailable */ }
}

/**
 * Safely gets a value from sessionStorage.
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
function sessionGet(key, defaultValue = null) {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (_) { return defaultValue; }
}

/* -------- Export for module use & tests -------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    sanitizeInput,
    getEl,
    qs,
    qsa,
    debounce,
    throttle,
    checkRateLimit,
    showToast,
    announceToScreenReader,
    trapFocus,
    showLoading,
    hideLoading,
    formatTime,
    randomInt,
    randomPick,
    formatNumber,
    sessionSet,
    sessionGet,
  };
}
