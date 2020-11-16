import { DynamicObject, TwoVector } from "lance-gg";
import MoonEngine from "../core/moonEngine";
import { check, hasAuthority } from "../utils";

/** [client] always at players average position each frame */
export default class CameraFocalPoint extends DynamicObject {
    onAddToWorld(gameEngine) {
        if (!hasAuthority()) {
            // Only bother using this on clients.
            super.onAddToWorld(gameEngine);
            gameEngine.on("postStep", this.tick.bind(this));
        }
    }

    tick() {
        /** @ts-ignore @type {MoonEngine} */
        const ge = this.gameEngine;
        const players = ge.getPlayers();
        this.position
            .copy(players.reduce(
                (x, y) => x.add(y.position), new TwoVector(0, 0)))
            .multiplyScalar(1 / players.length);
        console.log(this.position);
    }

    syncTo(other) { return super.syncTo(other); }
}