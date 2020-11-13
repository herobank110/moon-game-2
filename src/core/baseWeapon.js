import { BaseTypes, DynamicObject } from 'lance-gg';
import BasePawn from './basePawn';

export default class WeaponBase extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            wielderId: { type: BaseTypes.TYPES.INT32 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        /** The objectID who is wielding this weapon (could be an NPC) */
        this.wielderId = 0;
    }

    syncTo(other) {
        super.syncTo(other);
        this.wielderId = other.wielderId;
    }

    isWielded() { return this.wielderId != 0; }

    /** @returns {BasePawn?} assumes BasePawn objects are used for their weapon slots */
    getWielder() {
        return this.isWielded()
            ? this.gameEngine.world.queryObject({ id: this.wielderId })
            : null;
    }

    /** [server] attack with the weapon given the wielder's state */
    attack() { };
}
