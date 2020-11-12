import { BaseTypes, DynamicObject } from "lance-gg";

const moveSpeed = 1.3;

export default class Player extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            test: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.test = 2;
    }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);
        gameEngine.on('postStep', this.tick.bind(this));
    }

    syncTo(other) {
        super.syncTo(other);
        this.test = other.test;
    }

    // Input handlers

    moveLeft() {
        this.position.x -= moveSpeed;
    }

    moveRight() {
        this.position.x += moveSpeed;
    }

    jump() {
        this.velocity.y -= 2;
        // setTimeout(() => { this.velocity.y = 0 }, 10);
    }

    attack() {
        console.log('attack not implemented');
    }

    tick() {
        if (this.velocity.y < 0) {
            this.velocity.y += 0.1;
            if (this.velocity.y > 0) { this.velocity.y = 0; }
        }
    }
}