import { DynamicObject, TwoVector } from "lance-gg";
import MoonEngine from "../core/moonEngine";
import { check, hasAuthority } from "../utils";

/** [client] always at players average position each frame */
export default class CameraFocalPoint extends DynamicObject {
    static get netScheme() { return {}; }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        // Ignore any collisions.
        this.width = 0;
        this.height = 0;
    }

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
        // perform lerp for smoother motion.
        this.position.lerp(
            players.reduce((x, y) => x.add(y.position), new TwoVector(0, 0))
                .multiplyScalar(1 / players.length),
            0.4);
        console.log(this.position);
    }

    syncTo(other) { return super.syncTo(other); }
}