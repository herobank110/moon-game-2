import BasePawn from '../core/basePawn';
import { lerp, randomInRange } from '../utils/mathUtils';

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

        this.waitAtPointDurationMin = 3000;
        this.waitAtPointDurationMax = 6000;

        this.followTargetDurationMin = 1000;
        this.followTargetDurationMax = 1200;

        /** @type {(this: BaseEnemy) => void} */
        this.lastMoveFunc = null;
        this.aiFuncCounter = null;
    }

    /** @returns attack target's object ID, or -1 to disable targeting. */
    pickAttackTarget() { return -1; }

    scheduleNextMove() {
        let nextMove, delay;
        if (this.lastMoveFunc == this.waitAtPoint) {
            nextMove = this.followAttackTarget;
            delay = randomInRange(this.waitAtPointDurationMin, this.waitAtPointDurationMax);
        } else {
            nextMove = this.waitAtPoint;
            delay = randomInRange(this.followTargetDurationMin, this.followTargetDurationMax);
        }

        this.lastMoveFunc = nextMove;
        // @ts-ignore
        this.aiFuncCounter = setTimeout(nextMove.bind(this), delay);
    }

    followAttackTarget() {
        // TODO
    }

    waitAtPoint() {
        // TODO
    }

    syncTo(other) { super.syncTo(other); }

    onDied(instigator, reason) {
        super.onDied(instigator, reason);

        // Cancel any next move.
        if (this.aiFuncCounter !== null) {
            clearTimeout(this.aiFuncCounter);
        }
    }
}