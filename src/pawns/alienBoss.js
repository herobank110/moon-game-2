import BaseEnemy from "../core/baseEnemy";

export default class AlienBoss extends BaseEnemy {
    static get initialHealth() { return 100; }

    syncTo(other) { super.syncTo(other); }
}