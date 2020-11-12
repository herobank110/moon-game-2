import { BaseTypes, DynamicObject, TwoVector } from "lance-gg";

const moveSpeed = 0.7;
const moveSpeedInAir = 0.05;

export default class Player extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            isFacingRight: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        /** Sadly bool isn't supported by lance-gg. */
        this.isFacingRight = 1;
    }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);
        gameEngine.on('postStep', this.tick.bind(this));
    }

    syncTo(other) {
        super.syncTo(other);
        this.isFacingRight = other.isFacingRight;
    }

    // Input handlers

    moveLeft() {
        this.velocity.x -= this.isInAir() ? moveSpeedInAir : moveSpeed;
        this.isFacingRight = 0;
    }

    moveRight() {
        this.velocity.x += this.isInAir() ? moveSpeedInAir : moveSpeed;
        this.isFacingRight = 1;
    }

    get friction() {
        // Reduce X velocity when on ground. No friction in air
        return this.isInAir() ? new TwoVector(1, 1) : new TwoVector(0.5, 1);
    }
    set friction(v) { }

    jump() {
        if (!this.isInAir()) {
            this.velocity.y -= 2;
        }
    }

    isInAir() {
        return Math.abs(this.velocity.y) > 0.07;
    }

    attack() {
        console.log('attack not implemented');
    }

    tick() {
    }
}