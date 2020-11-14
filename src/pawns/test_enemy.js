import BasePawn from '../core/basePawn';
import { check, hasAuthority } from '../utils';
import { pawnsInWorld } from '../utils/lanceUtils';

export class test_Enemy extends BasePawn {
    syncTo(other) { return super.syncTo(other); }

    onDied(instigator, reason) {
        super.onDied(instigator, reason);

        if (hasAuthority()) {
            // @ts-ignore
            this.gameEngine.markPendingKill(this.id);
        }
    }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
        console.log('the test enemy took damage, down to', this.health);
    }
}