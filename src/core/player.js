import { BaseTypes, DynamicObject } from "lance-gg";

const moveSpeed = 1.3;

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
        this.position.x -= moveSpeed;
        this.isFacingRight = 0;
    }

    moveRight() {
        this.position.x += moveSpeed;
        this.isFacingRight = 1;
    }

    jump() {
        if (Math.abs(this.velocity.y) < 0.07) {
            this.velocity.y -= 2;
        }
    }

    attack() {
        console.log('attack not implemented');
    }

    tick() {
    }
}