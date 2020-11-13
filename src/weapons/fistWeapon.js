import BasePawn from '../core/basePawn';
import WeaponBase from '../core/baseWeapon';
import { closestObject, objectsInRange, pawnsInWorld } from '../utils/lanceUtils';

/** Furthest a player can be to be targeted. */
const attackRadius = 10;

/** Amount to damage when attacking. */
const damageAmount = 10;

export default class FistWeapon extends WeaponBase {
    attack() {
        const wielder = this.getWielder();
        if (!wielder) {
            throw new Error('cannot attack when weapon is unwieldy');
        }

        // @ts-ignore
        /** @type {BasePawn} */ const target =
            closestObject(
                objectsInRange(
                    pawnsInWorld(this.gameEngine.world),
                    wielder.position, attackRadius, [wielder]),
                wielder.position);

        if (target) {
            // An unlucky pawn was found!
            target.applyDamage(damageAmount, wielder, null);
        }
    }

    syncTo(other) { super.syncTo(other); }
}