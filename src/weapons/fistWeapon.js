import BasePawn from '../core/basePawn';
import WeaponBase from '../core/baseWeapon';
import { hasAuthority } from '../utils';
import { objectsInRange, pawnsInWorld } from '../utils/lanceUtils';

/** Furthest a player can be to be targeted. */
const attackRadius = 32;

/** Amount to damage when attacking. */
const damageAmount = 10;

export default class FistWeapon extends WeaponBase {
    static get attackRadius() { return 32; /* 16 is 1 tile */ }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.height = 16;
        this.width = 16;
    }

    attack() {
        // Be sure to only attack on the server!
        if (hasAuthority()) {
            const wielder = this.getWielder();
            if (!wielder) {
                throw new Error('cannot attack when weapon is unwieldy');
            }

            /** @ts-ignore @type {BasePawn[]} */
            const targets =
                objectsInRange(
                    pawnsInWorld(this.gameEngine.world),
                    wielder.position, attackRadius, [wielder]);

            targets.forEach(t => t.applyDamage(damageAmount, wielder, null));
        }
    }

    syncTo(other) { super.syncTo(other); }
}