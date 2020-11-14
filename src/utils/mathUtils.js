/** @typedef {import('.').Vector2Struct} Vector2Struct */

const lerpScalar = (a, b, x) => a + (b - a) * x;

const lerpVec2 = (a, b, x) => new a.constructor(
    lerpScalar(a.x, b.x, x),
    lerpScalar(a.y, b.y, x)
);

/**
 * @param {Vector2Struct|number} a
 * @param {Vector2Struct|number} b
 * @param {number} x
 * @returns {Vector2Struct|number}
 */
export const lerp = (a, b, x) => typeof a == 'number'
    ? lerpScalar(a, b, x)
    : lerpVec2(a, b, x);

/**
 * @param {number} v @param {number} a @param {number} b @param {number} c
 * @param {number} d
 */
export const mapRange = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));

/**
 * @param {Vector2Struct} origin 
 * @param {Vector2Struct} halfSize 
 * @returns {Vector2Struct}
 */
export const randomPointInBoundingBox = (origin, halfSize) => new origin.constructor(
    origin.x + halfSize.x * mapRange(Math.random(), 0, 1, -1, 1),
    origin.y + halfSize.y * mapRange(Math.random(), 0, 1, -1, 1)
);