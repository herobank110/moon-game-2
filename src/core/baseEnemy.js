import { DynamicObject } from 'lance-gg';
import BasePawn from './basePawn';
import { hasAuthority } from '../utils';
import { randomInRange } from '../utils/mathUtils';
import MoonEngine from './moonEngine';
import { closestObject } from '../utils/lanceUtils';

/**
 * Enemy AI consists of two phases which repeat in order:
 * 1. follow phase - pick an attack target and move towards him
 * 2. wait phase - stop moving and attack the target if in range
 */
export default class BaseEnemy extends BasePawn {
    static get netScheme() {
        return Object.assign({}, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        this.moveSpeed = 1;

        // All these properties are only relevant on the server.
        // The final position and damage events will be replicated.

        /** Object being targeted for attack. */
        this.attackTargetId = -1;

        this.waitAtPointDurationMin = 3000;
        this.waitAtPointDurationMax = 6000;

        this.followTargetDurationMin = 1000;
        this.followTargetDurationMax = 1200;

        /** Launch an attack when this close to the target. */
        this.attackPhaseRadius = 32;

        /** @type {(this: BaseEnemy) => void} */
        this.lastMoveFunc = null;
        this.aiFuncCounter = null;

        this.hasActivatedAi = false;
    }

    // AI phases

    /** [server] Do start AI. Subsequent calls ignored. */
    activateAi() {
        if (!this.hasActivatedAi) {
            this.hasActivatedAi = true;
            this.scheduleNextMove();
        }
    }

    tick() {
        super.tick();
        if (hasAuthority()) {
            // console.log('hasautheoriy');
            // Do phase ticking logic.
            if (this.lastMoveFunc === this.advanceTowardsAttackTarget) {
                this.advanceTowardsAttackTarget();
            }
            // The wait and attack phase doesn't have ticking logic.
        }
    }

    /** Called every move phase to set the attack target.
     * default: pick closest player
     * @returns attack target's object ID, or -1 to disable targeting */
    pickAttackTarget() { 
        /** @ts-ignore @type {MoonEngine} */
        const ge = this.gameEngine;
        return ge ? closestObject(ge.getPlayers(), this.position)?.id ?? -1 : -1;
     }

    /** Called infrequently to set AI phase ticking logic. */
    scheduleNextMove() {
        let delay;
        if (this.lastMoveFunc === this.advanceTowardsAttackTarget) {
            this.lastMoveFunc = this.waitAtPoint;
            delay = randomInRange(this.waitAtPointDurationMin, this.waitAtPointDurationMax);
        } else {
            // This is also the initial case when lastMoveFunc is null.
            this.lastMoveFunc = this.advanceTowardsAttackTarget;
            delay = randomInRange(this.followTargetDurationMin, this.followTargetDurationMax);
            // Refresh the attack target.
            this.attackTargetId = this.pickAttackTarget();
        }

        // Execute the function at least once. It may be called in tick as well.
        this.lastMoveFunc.call(this);

        // @ts-ignore (delay is always a number)
        this.aiFuncCounter = setTimeout(() => this.scheduleNextMove(), delay);
    }

    /** [tick] Advance towards the move target, if any. */
    advanceTowardsAttackTarget() {
        const target = this.getAttackTarget();
        if (target && this.distanceTo(target.position) > 16) {
            const direction = this.directionTo(target.position);

            // Ideally multiply by delta time but assume the server
            // uses a constant tick rate.
            this.position.add(direction.multiplyScalar(this.moveSpeed));

            // Use numbers instead of bool to satisfy lance-gg.
            this.isFacingRight = (direction.x >= 0 ? 1 : 0);
        }
    }

    /** Wait until told to move again. Also attack. */
    waitAtPoint() {
        // Use the weapon's attack in current configuration if available.
        const target = this.getAttackTarget();
        if (target) {
            const direction = this.directionTo(target.position);
            // Use numbers instead of bool to satisfy lance-gg.
            this.isFacingRight = (direction.x >= 0 ? 1 : 0);

            if (this.isWithinAttackRange(target)) {
                this.getWeapon()?.attack();
            }
        }
    }

    // BasePawn interface

    onDied(instigator, reason) {
        super.onDied(instigator, reason);

        if (hasAuthority()) {
            // Cancel any next move.
            if (this.aiFuncCounter !== null) {
                clearTimeout(this.aiFuncCounter);
            }
            // @ts-ignore
            this.gameEngine.markPendingKill(this.id);
        }
    }

    // helpers

    /** don't override this, use pickAttackTarget()
     * @returns {DynamicObject?} */
    getAttackTarget() {
        return this.attackTargetId == -1 ? null
            : this.gameEngine.world.queryObject({ id: this.attackTargetId, instanceType: DynamicObject });
    }

    /** @param {DynamicObject} target */
    isWithinAttackRange(target) {
        return this.distanceTo(target.position) <= this.attackPhaseRadius;
    }

    syncTo(other) { super.syncTo(other); }
}