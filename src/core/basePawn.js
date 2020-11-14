import { BaseTypes, DynamicObject, GameObject } from 'lance-gg';
import { hasAuthority } from '../utils';
import WeaponBase from './baseWeapon';

/**
 * Sadly lance's GameComponents don't seem to replicate easily
 * so using an inheritance approach.
 */
export default class BasePawn extends DynamicObject {
    static get initialHealth() { return 100; }

    static get netScheme() {
        return Object.assign({
            health: { type: BaseTypes.TYPES.FLOAT32 },
            weaponSlot: { type: BaseTypes.TYPES.INT32 },
            isFacingRight: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.width = 16;
        this.height = 16;

        // This is how you get static members overridden by derived classes.
        // @ts-ignore
        /** @type {number} */ this.health = this.constructor.initialHealth;
        this.weaponSlot = -1;
        /** Sadly bool isn't supported by lance-gg. */
        this.isFacingRight = 1;
    }

    syncTo(other) {
        super.syncTo(other);
        this.health = other.health;
        this.weaponSlot = other.weaponSlot;
        this.isFacingRight = other.isFacingRight;
    }

    // DamageComponent interface

    isAlive() { return this.health > 0; }

    isDead() { return !this.isAlive(); }

    /**
     * @param {number} amount 
     */
    applyDamage(amount, instigator, reason) {
        if (this.isAlive() && this.canTakeDamage(instigator, reason)) {
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
    onDied(instigator, reason) { }

    // WeaponSlotComponent interface

    isWielding() { return this.weaponSlot != -1; }
    isPacking() { return this.isWielding(); }

    /** @returns {WeaponBase?} */
    getWeapon() {
        return this.isWielding()
            ? this.gameEngine.world.queryObject({ id: this.weaponSlot })
            : null;
    }

    /**
     * @param {number} objectId
     */
    pickupWeapon(objectId) {
        if (!hasAuthority()) {
            throw new Error('cannot pickup weapons from client');
        }

        // check its valid
        const weapon = this.gameEngine.world.queryObject({ id: objectId });
        if (!weapon) {
            throw new Error('pickup weapon id doesn\'t exist in world');
        }

        this.assignWeaponToSlot(weapon)
    }

    /**
     * @param {WeaponBase} weaponInst
     */
    assignWeaponToSlot(weaponInst) {
        if (weaponInst.wielderId != 0) {
            throw new Error('some pawn already wields this weapon' + weaponInst.id);
        }
        weaponInst.wielderId = this.id;
        this.weaponSlot = weaponInst.id;
    }
}