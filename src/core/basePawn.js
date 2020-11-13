import { BaseTypes, DynamicObject, GameObject } from "lance-gg"

/**
 * Sadly lance's GameComponents don't seem to replicate easily
 * so using an inheritance approach.
 */
export default class BasePawn extends DynamicObject {
    static get initialHealth() { return 100; }

    static get netScheme() {
        return Object.assign({
            health: { type: BaseTypes.TYPES.FLOAT32 }
        }, super.netScheme);
    }


    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        // This is how you get static members overridden by derived classes.
        // @ts-ignore
        /** @type {number} */ this.health = this.constructor.initialHealth;
    }

    // DamageComponent interface

    isAlive() { return this.health > 0; }

    isDead() { return !this.isAlive(); }

    /**
     * @param {number} amount 
     */
    applyDamage(amount, instigator, reason) {
        if (this.isAlive()) {
            this.health -= amount;
            if (this.isDead()) {
                this.onDied(instigator, reason);
            }
        }
    }

    /**
     * @param {GameObject} instigator
     */
    canTakeDamage(instigator, reason) { return true; }

    /**
     * @param {GameObject} instigator
     */
    onDied(instigator, reason) {}
}