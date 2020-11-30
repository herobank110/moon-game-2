import BaseEnemy from "../core/baseEnemy";

export default class AlienBoss extends BaseEnemy {
    static get initialHealth() { return 200; }
    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.followTargetDurationMin = 1.0;
        this.followTargetDurationMax = 1.5;

        this.waitAtPointDurationMin = 9;
        this.waitAtPointDurationMax = 13;
    }

    syncTo(other) { super.syncTo(other); }
}