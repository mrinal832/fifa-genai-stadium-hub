/**
 * @jest-environment jsdom
 */
// Unit tests for ai-engine.js

// Mock fetch globally
global.fetch = jest.fn();

// Provide required globals for ai-engine
global.sanitizeInput = (s) => typeof s === 'string' ? s.trim().substring(0, 1000) : '';
global.checkRateLimit = () => true;
global.randomPick = (arr) => arr[0];
global.sessionSet = () => {};

const { activateAIEngine, isAIActive, deactivateAI, generateAIResponse } = require('../../js/ai-engine.js');

describe('activateAIEngine', () => {
  afterEach(() => deactivateAI());

  test('returns false for empty key', async () => {
    expect(await activateAIEngine('')).toBe(false);
  });

  test('returns false for null key', async () => {
    expect(await activateAIEngine(null)).toBe(false);
  });

  test('returns false for short key', async () => {
    expect(await activateAIEngine('short')).toBe(false);
  });

  test('returns true for valid format key', async () => {
    const result = await activateAIEngine('AIzaSyTestKeyLongEnoughToPassValidation123');
    expect(result).toBe(true);
  });

  test('sets isAIActive to true on valid key', async () => {
    await activateAIEngine('AIzaSyTestKeyLongEnoughToPassValidation456');
    expect(isAIActive()).toBe(true);
  });
});

describe('deactivateAI', () => {
  test('sets isAIActive to false', async () => {
    await activateAIEngine('AIzaSyTestKeyLongEnoughToPassValidation789');
    deactivateAI();
    expect(isAIActive()).toBe(false);
  });
});

describe('generateAIResponse — fallback mode', () => {
  beforeEach(() => deactivateAI()); // AI not active, uses fallback

  test('returns a non-empty string for navigation module', async () => {
    const result = await generateAIResponse('Where is Gate A?', 'navigation');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for crowd module', async () => {
    const result = await generateAIResponse('Crowd status?', 'crowd');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for transport module', async () => {
    const result = await generateAIResponse('Best way to get here?', 'transport');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for sustainability module', async () => {
    const result = await generateAIResponse('Eco tips', 'sustainability');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for accessibility module', async () => {
    const result = await generateAIResponse('Wheelchair route', 'accessibility');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for operations module', async () => {
    const result = await generateAIResponse('Assign tasks', 'operations');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns a non-empty string for decisions module', async () => {
    const result = await generateAIResponse('Status report', 'decisions');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  test('returns rate-limit message when rate limited', async () => {
    global.checkRateLimit = () => false;
    const result = await generateAIResponse('test', 'navigation');
    expect(result).toContain('Rate limit');
    global.checkRateLimit = () => true; // restore
  });

  test('returns empty fallback for empty prompt', async () => {
    const result = await generateAIResponse('', 'navigation');
    expect(result).toBe('Please provide a valid question.');
  });

  test('caches identical prompts for same module', async () => {
    const p = 'cache test query ' + Date.now();
    const r1 = await generateAIResponse(p, 'crowd');
    const r2 = await generateAIResponse(p, 'crowd');
    expect(r1).toBe(r2);
  });
});
