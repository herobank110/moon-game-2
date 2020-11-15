import { BaseTypes, DynamicObject, GameObject, TwoVector } from 'lance-gg';
import { dist, hasAuthority } from '../utils';
import { randomPointInBoundingBox } from '../utils/mathUtils';
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
        /** Zero is a valid ID in lance-gg. Use -1 for invalid */
        this.weaponSlot = -1;
        /** Sadly bool isn't supported by lance-gg. */
        this.isFacingRight = 1;
        /** Whether onDied has been called yet. */
        this.calledOnDied = false;
    }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);
        gameEngine.on('postStep', this.tick.bind(this));
    }

    syncTo(other) {
        super.syncTo(other);
        this.health = other.health;
        this.weaponSlot = other.weaponSlot;
        this.isFacingRight = other.isFacingRight;
    }

    tick() {
        if (!this.calledOnDied && this.isDead()) {
            this.calledOnDied = true;
            this.onDied(null, null);
        }
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
     * @warning This will be called on clients as a convenience but the
     * arguments will always be null! Only the server passes the args from
     * apply damage!
     * 
     * @param {GameObject?} instigator
     */
    onDied(instigator, reason) {
        this.calledOnDied = true;
        this.dropWeapon();
    }

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
            // not sure if this is necessary. lance will sync weaponSlot anyway
            throw new Error('cannot pickup weapons from client');
        }

        // Drop any current weapon to pick up the new one.
        this.dropWeapon();

        // check its valid
        const weapon = this.gameEngine.world.queryObject({ id: objectId });
        if (!weapon) {
            throw new Error('pickup weapon id doesn\'t exist in world');
        }

        // console.log('picked up weapon by wielder id', this.id);
        this.assignWeaponToSlot(weapon);
    }

    dropWeapon() {
        const weapon = this.getWeapon();
        if (weapon) {

            // Place the weapon in a random nearby drop location.
            /** @ts-ignore @type {TwoVector} */
            const dropPos = randomPointInBoundingBox(
                this.position.clone().add(new TwoVector(0, -32)),
                new TwoVector(16, 16)
            );
            weapon.position.copy(dropPos);
            this.removeWeaponFromSlot(weapon);
        }
    }

    /**
     * @param {WeaponBase} weaponInst
     */
    removeWeaponFromSlot(weaponInst) {
        if (weaponInst.id == 0) {
            // already not holding weapon
            return;
        }
        if (weaponInst.wielderId != this.id) {
            throw new Error('tried to de-equip a weapon not wielded by myself ' + weaponInst.id)
        }
        weaponInst.wielderId = -1;
        this.weaponSlot = -1;
    }

    /**
     * @param {WeaponBase} weaponInst
     */
    assignWeaponToSlot(weaponInst) {
        if (this.isPacking()) {
            throw new Error('some pawn already wields this weapon ' + weaponInst.id);
        }
        weaponInst.wielderId = this.id;
        this.weaponSlot = weaponInst.id;
    }

    /** @param {TwoVector} goal */
    directionTo(goal) { return this.position.clone().subtract(goal).normalize(); }

    /** @param {TwoVector} goal */
    distanceTo(goal) { return dist(this.position, goal); }
}