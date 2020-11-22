import { TwoVector } from "lance-gg";
import MoonEngine from "../core/moonEngine";

/** [client] always at players average position each frame
 * 
 * @param {MoonEngine} gameEngine
 */
function getPlayersAveragePosition(gameEngine) {
    const players = gameEngine.getPlayers();
    return players.reduce((x, y) => x.add(y.position), new TwoVector(0, 0))
        .multiplyScalar(1 / players.length);
}

/** [client] get focal point of camera
 * 
 * @param {MoonEngine} gameEngine
 */
export function getCameraFocalPoint(gameEngine) {
    // TODO also have elevator position.
    return getPlayersAveragePosition(gameEngine);
}