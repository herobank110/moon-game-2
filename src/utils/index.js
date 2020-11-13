import { DynamicObject, GameWorld, TwoVector } from 'lance-gg';

/**
 * @typedef {{ x: number, y: number }} Vector2Struct
 */

/**
 * @param {Vector2Struct} a
 * @param {Vector2Struct} b
 */
export function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * @param {DynamicObject[]} objectSet
 * @param {Vector2Struct} start
 * @param {number} maxDistance
 */
export function objectsInRange(objectSet, start, maxDistance, ignored = []) {
    return objectSet.filter(obj => !ignored.includes(obj) && dist(start, obj.position) < maxDistance);
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

/**
 * @param {DynamicObject[]} objectSet
 * @param {Vector2Struct} start
 * @return {DynamicObject|null}
 */
export function closestObject(objectSet, start) {
    const i = bestElement(objectSet, obj => dist(start, obj.position));
    return i == -1 ? null : objectSet[i];
}

/**
 * @param {GameWorld} world
 * @returns {DynamicObject[]}
 */
export function getNonStaticObjects(world) {
    return world.queryObjects({ instanceType: DynamicObject }).filter(obj => !obj.isStatic);
}

export function hasAuthority() {
    // Assuming a headless nodejs server.
    return typeof window == 'undefined';
}