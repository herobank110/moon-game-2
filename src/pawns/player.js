import { TwoVector } from 'lance-gg';
import { check, hasAuthority } from '../utils';
import BasePawn from '../core/basePawn';

const moveSpeed = 0.7;
const moveSpeedInAir = 0.05;

export default class Player extends BasePawn {
    static get initialHealth() { return 100; }

    // @ts-ignore
    get friction() {
        // Reduce X velocity when on ground. No friction in air
        return this.isInAir() ? new TwoVector(1, 1) : new TwoVector(0.5, 1);
    }
    set friction(v) { }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.grabCandidateId = 0;
    }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);
        gameEngine.on('postStep', this.tick.bind(this));
    }

    // Derived classes MUST implement this explicitly.
    syncTo(other) { super.syncTo(other); }

    // Input handlers

    moveLeft() {
        if (this.canMove()) {
            this.velocity.x -= this.isInAir() ? moveSpeedInAir : moveSpeed;
            this.isFacingRight = 0;
        }
    }

    moveRight() {
        if (this.canMove()) {
            this.velocity.x += this.isInAir() ? moveSpeedInAir : moveSpeed;
            this.isFacingRight = 1;
        }
    }

    jump() {
        if (this.canMove() && !this.isInAir()) {
            this.velocity.y -= 2;
        }
    }

    attack() {
        if (this.canAttack()) {
            const weapon = this.getWeapon();
            check(weapon, 'weapon must be valid to attack, see Player::canAttack()');
            console.log('attack still not implemented!');
        }
    }

    toggleWeaponSlot() {
        if (!hasAuthority()) {
            // Allow the server to take care of this one.
            return;
        }

        if (this.isPacking()) { return void this.dropWeapon() }
        // Try pickup nearby weapon.
        if (this.grabCandidateId != 0) {
            this.pickupWeapon(this.grabCandidateId);
        }
    }


    // Utilities

    isInAir() { return Math.abs(this.velocity.y) > 0.07; }

    canAttack() { return hasAuthority() && this.isPacking(); }

    canMove() { return true; }

    // Testing

    tick() {
        if (!hasAuthority()) {
            // logging on browser gets cleared each refresh 
            // console.log(`player ${this.playerId} has ${this.health} health`);
            // console.log('my weapon', this.getWeapon());
        }
    }

    onDied(instigator, reason) {
        console.log('i am dead!');
    }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
        console.log('health now', this.health);
    }
}