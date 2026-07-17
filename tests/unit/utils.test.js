/**
 * @jest-environment jsdom
 * Unit tests for utils.js
 */

const {
  sanitizeHTML,
  sanitizeInput,
  debounce,
  throttle,
  checkRateLimit,
  formatTime,
  randomInt,
  randomPick,
  formatNumber,
  sessionSet,
  sessionGet,
} = require('../../js/utils.js');

describe('sanitizeHTML', () => {
  test('escapes < and > characters', () => {
    expect(sanitizeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
  });

  test('escapes & ampersand', () => {
    expect(sanitizeHTML('Fish & Chips')).toBe('Fish &amp; Chips');
  });

  test('escapes double quotes', () => {
    expect(sanitizeHTML('"Hello"')).toBe('&quot;Hello&quot;');
  });

  test('escapes single quotes', () => {
    expect(sanitizeHTML("it's")).toBe("it&#x27;s");
  });

  test('returns empty string for non-string input', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
    expect(sanitizeHTML(42)).toBe('');
  });

  test('returns safe string unchanged if no special chars', () => {
    expect(sanitizeHTML('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeInput', () => {
  test('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  test('strips HTML tags', () => {
    expect(sanitizeInput('<b>bold</b>')).not.toContain('<b>');
  });

  test('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
  });

  test('removes event handlers', () => {
    expect(sanitizeInput('onclick=evil()')).not.toContain('onclick=');
  });

  test('truncates to maxLength', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeInput(long, 100).length).toBeLessThanOrEqual(100);
  });

  test('returns empty string for non-string', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('cancels previous timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    jest.advanceTimersByTime(100);
    debounced();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  test('executes immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('blocks subsequent calls within the limit window', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Use unique keys so tests don't interfere
  });

  test('allows first request', () => {
    expect(checkRateLimit(`test_${Date.now()}_1`, 5, 60000)).toBe(true);
  });

  test('allows requests up to the max limit', () => {
    const key = `test_${Date.now()}_2`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60000)).toBe(true);
    }
  });

  test('blocks request beyond the max limit', () => {
    const key = `test_${Date.now()}_3`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60000);
    expect(checkRateLimit(key, 3, 60000)).toBe(false);
  });
});

describe('formatTime', () => {
  test('returns a non-empty string', () => {
    const result = formatTime();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('formats a specific date correctly', () => {
    const d = new Date('2026-07-18T15:30:00');
    const result = formatTime(d);
    expect(result).toMatch(/03:30|15:30/); // handles 12h/24h
  });
});

describe('randomInt', () => {
  test('returns integer within [min, max]', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  test('returns min when min === max', () => {
    expect(randomInt(7, 7)).toBe(7);
  });
});

describe('randomPick', () => {
  test('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const result = randomPick(arr);
    expect(arr).toContain(result);
  });

  test('works with single element array', () => {
    expect(randomPick(['only'])).toBe('only');
  });
});

describe('formatNumber', () => {
  test('formats large numbers with commas', () => {
    expect(formatNumber(1000000)).toMatch(/1,000,000/);
  });

  test('formats small numbers without change', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('sessionSet and sessionGet', () => {
  test('stores and retrieves a string value', () => {
    sessionSet('test_key', 'hello');
    expect(sessionGet('test_key')).toBe('hello');
  });

  test('stores and retrieves an object', () => {
    const obj = { foo: 'bar', num: 42 };
    sessionSet('test_obj', obj);
    expect(sessionGet('test_obj')).toEqual(obj);
  });

  test('returns defaultValue for missing key', () => {
    expect(sessionGet('nonexistent_key_xyz', 'default')).toBe('default');
  });
});
