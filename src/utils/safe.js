/**
 * Safety wrapper to ensure numeric values are finite and valid for CSS/DOM calculations.
 * Prevents "non-finite double" errors in browser extensions like Project Naptha.
 * @param {any} val - The value to sanitize
 * @param {number} fallback - Default value if val is non-finite
 * @returns {number}
 */
export const safe = (val, fallback = 0) => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Ensures an angle is finite and defaults to 0.
 */
export const safeAngle = (angle) => safe(angle, 0);

/**
 * Ensures a position object {x, y} is safe.
 */
export const safePos = (pos) => ({
  x: safe(pos?.x, 0),
  y: safe(pos?.y, 0)
});
