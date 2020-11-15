import BaseEnemy from "../core/baseEnemy";
import MoonEngine from "../core/moonEngine";
import { closestObject } from "../utils/lanceUtils";

export default class AlienGoon extends BaseEnemy {
    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);

        // Create a fist weapon also.

    }

    pickAttackTarget() {
        /** @ts-ignore @type {MoonEngine} */
        const ge = this.gameEngine;
        
        return ge ? closestObject(ge.getPlayers(), this.position)?.id ?? -1 : -1;
    }

    syncTo(other) { super.syncTo(other); }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
    }
}