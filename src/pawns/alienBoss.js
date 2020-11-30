import BaseEnemy from "../core/baseEnemy";
import MoonEngine from "../core/moonEngine";

export default class AlienBoss extends BaseEnemy {
    static get initialHealth() { return 200; }
    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.lastTarget = null;
        this.followTargetDurationMin = 2000;
        this.followTargetDurationMax = 3000;
    }

    /** [server] Alternate attack target each time. */
    pickAttackTarget() {
        super.pickAttackTarget()
        /** @ts-ignore @type {MoonEngine} */
        /** @ts-ignore @type {MoonEngine} */
        const ge = this.gameEngine;
        if (ge) {
            const players = ge.getPlayers();
            for (const p of players) {
                if (p.id != this.lastTarget) {
                    this.lastTarget = p.id;
                    return p.id;
                }
            }
        }
        return -1;
    }

    syncTo(other) { super.syncTo(other); }
}