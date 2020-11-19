import { makeInvisibleWall } from "../utils/lanceUtils";
import MoonEngine from "./moonEngine";

const maxHeight = 300;

/** @param {MoonEngine} gameEngine */
export function startElevatorSequence(gameEngine) {
    for (const rect of [
        { x: 128,       y: maxHeight,      w: 112, h: 32 },
        { x: 128,       y: maxHeight + 64, w: 112, h: 32 },
        { x: 128,       y: maxHeight,      w: 16,  h: 64 },
        { x: 128 + 112, y: maxHeight,      w: 16,  h: 64 },
    ]) {
        gameEngine.addObjectToWorld(makeInvisibleWall(rect));
    }
}

/** Assumes constant tick rate. Must call startElevatorSequence() first. */
export function tickElevatorSequence() {

}