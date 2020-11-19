import { check } from "../utils";
import { makeInvisibleWall } from "../utils/lanceUtils";
import MoonEngine from "./moonEngine";

const maxHeight = 300;

/** [server] start an animated elevator descent.
 * @param {MoonEngine} gameEngine */
export function startElevatorSequence(gameEngine) {
    // Make the elevator collision walls.
    for (const rect of [
        { x: 128,       y: maxHeight,      w: 112, h: 32 },
        { x: 128,       y: maxHeight + 64, w: 112, h: 32 },
        { x: 128,       y: maxHeight,      w: 16,  h: 64 },
        { x: 128 + 112, y: maxHeight,      w: 16,  h: 64 },
    ]) {
        gameEngine.addObjectToWorld(makeInvisibleWall(rect));
    }

    // Put players in the elevator.
    const players = gameEngine.getPlayers();
    check(players.length == 2, 'must be 2 players for elevator to start');
    players[0].position.set(128 + 16 * 1, maxHeight + 48);
    players[1].position.set(128 + 16 * 3, maxHeight + 48);
}

/** Assumes constant tick rate. Must call startElevatorSequence() first. */
export function tickElevatorSequence() {
    // TODO: move elevator collision objects down
}