import BaseEnemy from "../core/baseEnemy";

export default class AlienGoon extends BaseEnemy {
    static get initialHealth() { return 10; }

    onAddToWorld(gameEngine) {
        super.onAddToWorld(gameEngine);

        // Create a fist weapon also.

    }

    syncTo(other) { super.syncTo(other); }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
    }
}