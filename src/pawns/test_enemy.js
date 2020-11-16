import MoonEngine from '../core/moonEngine';
import BaseEnemy from '../core/baseEnemy';

export class test_Enemy extends BaseEnemy {
    syncTo(other) { return super.syncTo(other); }

    /** Always target player 1. */
    pickAttackTarget() {
        /** @ts-ignore @type {MoonEngine} */
        const ge = this.gameEngine;
        return ge ? ge.getPlayers()[0].id : -1;
    }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
        console.log('the test enemy took damage, down to', this.health);
    }
}