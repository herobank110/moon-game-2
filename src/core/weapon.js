import { BaseTypes, DynamicObject } from "lance-gg";

export default class WeaponBase extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            wielderId : { type: BaseTypes.TYPES.INT32 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        /** The objectID who is wielding this weapon (could be an NPC) */
        this.wielderId = 0;
    }
}