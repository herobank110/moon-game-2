import BasePawn from '../core/basePawn';

export class test_Enemy extends BasePawn {
    syncTo(other) { return super.syncTo(other); }

    onDied(instigator, reason) {
        super.onDied(instigator, reason);
        console.log('oh no, the test enemy died!');
    }

    applyDamage(amount, instigator, reason) {
        super.applyDamage(amount, instigator, reason);
        console.log('the test enemy took damage, down to', this.health);
    }
}