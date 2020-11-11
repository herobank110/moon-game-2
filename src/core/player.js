import { BaseTypes, DynamicObject } from "lance-gg";

export default class Player extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            test: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.test = 2;
    }

    syncTo(other) {
        super.syncTo(other);
        this.test = other.test;
    }
}