import { TwoVector } from 'lance-gg';
import BasePawn from '../core/basePawn';

export default class BaseEnemy extends BasePawn {
    static get netScheme() {
        return Object.assign({}, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        // All these properties are only relevant on the server.
        // The final position and damage events will be replicated.

        /** Object being targeted for attack. */
        this.attackTargetId = -1;

        this.waitAtPointDurationMin = 3;
        this.waitAtPointDurationMax = 6;

        this.followTargetDurationMin = 1;
        this.followTargetDurationMax = 1.2;

        this.lastMoveFunc = null;
    }

    /** @returns attack target's object ID, or -1 to disable targeting. */
    pickAttackTarget() { return -1; }

    scheduleNextMove() {
        // TODO
    }

    followTarget() {
        // TODO
    }

    waitAtPoint() {
        // TODO
    }

    syncTo(other) { super.syncTo(other); }
}