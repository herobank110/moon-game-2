import { DynamicObject, GameEngine, GameWorld, TwoVector } from 'lance-gg';
import BasePawn from '../core/basePawn';
import { bestElement, dist } from './index';
/** @typedef {import('.').Vector2Struct} Vector2Struct */

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

/**
 * @param {DynamicObject[]} objectSet
 * @param {Vector2Struct} start
 * @param {number} maxDistance
 */
export function objectsInRange(objectSet, start, maxDistance, ignored = []) {
    return objectSet.filter(obj => !ignored.includes(obj) && dist(start, obj.position) < maxDistance);
}

/**
 * @param {GameWorld} world 
 */
export function pawnsInWorld(world) {
    return world.queryObjects({ instanceType: BasePawn });
}

/**
 * @param {GameEngine} gameEngine
 * @param {{x, y, w, h}} rect
 * @param {import('lance-gg').SubclassOf<DynamicObject>?} classOverride
 */
export function makeInvisibleWall(gameEngine, rect, classOverride = undefined) {
    return new (classOverride ?? DynamicObject)(gameEngine, null, {
        isStatic: 1, position: new TwoVector(rect.x, rect.y),
        width: rect.w, height: rect.h
    });
}