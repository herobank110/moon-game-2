import { BaseTypes, GameComponent, GameObject } from 'lance-gg';

export default class DamageComponent extends GameComponent {
    static get netScheme() {
        return Object.assign({
            health: { type: BaseTypes.TYPES.FLOAT32 }
        }, super.netScheme);
    }

    constructor(initialHealth) {
        super();

        this.health = initialHealth;
        this.canTakeDamage = null;
    }

    /**
     * @param {number} amount
     * @param {GameObject?} instigator
     * @param {any?} reason
     */
    applyDamage(amount, instigator, reason) {
        if (!this.isDead()) {
            if (typeof this.canTakeDamage != 'function' || this.canTakeDamage(instigator, reason)) {
                this.health -= amount;
            }
        }
    }

    isDead() { return this.health <= 0; }
}