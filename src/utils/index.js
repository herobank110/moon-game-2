/**
 * @typedef {{
 *    x: number, y: number,
 *    constructor: Function
 * }} Vector2Struct
 */

/**
 * @param {Vector2Struct} a
 * @param {Vector2Struct} b
 */
export function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * @param {any[]} arr
 * @param {(el: any) => number} scoreFunc get score of element
 * (positive to be counted, higher is better)
 * @returns {number} index of best element, or -1 if invalid.
 */
export function bestElement(arr, scoreFunc) {
    let bestI = -1;
    let bestScore = -1;

    for (let i = 0; i < arr.length; i++) {
        const score = scoreFunc(arr[i]);
        if (score > bestScore) {
            bestScore = score;
            bestI = i;
        }
    }
    return bestI;
}

/** Assumes the authority is a headless NodeJS server. */
export function hasAuthority() { return typeof window == 'undefined'; }

/** Check an expression is true or throw an Error. */
export function check(expr, errorMessage) {
    if (!expr) { throw new Error(errorMessage); }
}