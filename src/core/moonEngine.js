/// <reference types='../types/lance-gg' />
import { DynamicObject, GameEngine, KeyboardControls, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import { closestObject, getNonStaticObjects, makeInvisibleWall, objectsInRange } from '../utils/lanceUtils';
import { check, hasAuthority } from '../utils';
import Player from '../pawns/player';
import FistWeapon from '../weapons/fistWeapon';
import WeaponBase from './baseWeapon';
import AlienGoon from '../pawns/alienGoon';
import Elevator from './elevator';
import { R } from '../utils/constants';

/** Range for players to grab items. */
const grabItemRange = 32;

export default class MoonEngine extends GameEngine {
    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({
            gameEngine: this,
            gravity: new TwoVector(0, 0.045),
            collisions: { autoResolve: true }
        });
        this.pendingKill = [];
        this.hasMatchStarted = false;

        this.on('postStep', this.stepLogic.bind(this));
        this.on('server__init', this.server_init.bind(this));
        this.on('server__playerJoined', this.server_playerJoined.bind(this));
        this.on('server__playerDisconnected', this.server_playerDisconnected.bind(this));
        this.on('client__rendererReady', this.client_init.bind(this));
        this.on('client__draw', this.client_draw.bind(this));
        // My custom events.
        this.on('matchStart', this.startMatch.bind(this));
    }

    registerClasses(serializer) {
        super.registerClasses(serializer);
        serializer.registerClass(Player);
        serializer.registerClass(DynamicObject);
        serializer.registerClass(FistWeapon);
        serializer.registerClass(AlienGoon);
        serializer.registerClass(Elevator);
    }

    stepLogic() {
        // Check match start logic.
        if (!this.hasMatchStarted && this.canStartMatch()) {
            // Each client will be slightly out of sync with this, but that's ok.
            this.hasMatchStarted = true;
            this.emit('matchStart');
        } else if (this.hasMatchStarted && !this.canStartMatch()) {
            // Match became invalidated during play (someone left).
            if (hasAuthority()) {
                this.resetMatch();
            }
            this.hasMatchStarted = false;
            this.emit('matchHalt');
        }

        // WeaponBase is an item that can be held by one player
        // and a player can only hold one of at a time.
        const weapons = this.world.queryObjects({ instanceType: WeaponBase });
        for (const player of this.getPlayers()) {
            const closestItem = closestObject(
                objectsInRange(weapons, player.position, grabItemRange),
                player.position
            );
            player.grabCandidateId = closestItem?.id ?? 0;
        }

        // Destroy pending kill objects.
        this.pendingKill.forEach(oId => this.removeObjectFromWorld(oId));
        this.pendingKill.splice(0, this.pendingKill.length);
    }

    /** Start a new match once all players are joined and ready. */
    startMatch() {
        if (hasAuthority()) {
            const elevator = this.world.queryObject({ instanceType: Elevator });
            check(elevator, 'using test- getFirstElevatorOfWorld failed');
            setTimeout(() => elevator.startElevatorSequence(), 30000);
            throw new Error('TODO: check delay of elevator for MoonEngine::startMatch()');
        }
    }

    /** [server] reset the match state for new players to join
     * 
     * (clients should have left already)
     */
    resetMatch() {
        // Invalidate player IDs.
        const players = this.getPlayers();
        for (const p of players) {
            p.playerId = 0;
        }

        this.hasMatchStarted = false;

        // TODO: Reload first scene or kill transient actors (enemies, weapons, etc)
    }

    /** [server] Set a player to be ready. Cannot unready a player!
     * @param {{playerId: number}} options
     */
    setPlayerReady(options) {
        const player = this.getPlayerById(options.playerId);
        check(player, 'invalid player id to setPlayerReady ' + options.playerId);
        player.isReady = 1;
        console.log('readied up player', options.playerId);
    }

    /** @returns whether the game can be started */
    canStartMatch() {
        const players = this.getPlayers();
        return players.length == 2 && players.every(p => p.isReady);
    }

    processInput(inputDesc, playerId, isServer) {
        super.processInput(inputDesc, playerId, isServer);

        // Replicated function callers.
        const serverMatch = inputDesc.input.match(/server_(.*)/);
        if (serverMatch) {
            // This can be caused with callOnServer()
            if (isServer) this[serverMatch[1]](inputDesc.options);
            return;
        }
        const clientMatch = inputDesc.input.match(/client_(.*)/);
        if (clientMatch) {
            // Idk how to invoke this behaviour on clients!
            if (!isServer) this[clientMatch[1]](inputDesc.options);
            return;
        }

        const player = this.world.queryObject({ playerId, instanceType: Player });
        if (player) {
            switch (inputDesc.input) {
                case 'left': player.moveLeft(); break;
                case 'right': player.moveRight(); break;
                case 'jump': player.jump(); break;
                case 'attack': player.attack(); break;
                case 'weaponSlot': player.toggleWeaponSlot(); break;
                // @ts-ignore
                case 'debugCollision': this.renderer?.toggleShowCollision(); break;
                default: throw new Error(`invalid input action ${inputDesc.input} See: MoonEngine::processInput`);
            }
        }
    }

    callOnServer(funcName, options) {
        if (hasAuthority()) {
            // Already the server. Call locally.
            return void this[funcName](options);
        }
        // this is the client.
        this.renderer.clientEngine.sendInput('server_' + funcName, options);
    }

    server_init() {
        this.addObjectToWorld(new Player(this,
            { id: R.id.player1 }, { position: new TwoVector(96, 112) }));
        this.addObjectToWorld(new Player(this,
            { id: R.id.player2 }, { position: new TwoVector(32, 112) }));

        // Make invisible walls.
        for (const rect of [
            { x: 0, y: 128, w: 1000000, h: 64 },
            { x: 0, y: 0, w: 16, h: 128 }
        ]) {
            this.addObjectToWorld(makeInvisibleWall(this, rect));
        }

        // Make elevator(s)
        const el = new Elevator(this, null, null)
        el.startPos.copy(el.position.set(128, 100));
        el.endPos.set(128, 0);
        this.addObjectToWorld(el);

        // TODO remove below testing code

        // test start elevator now
        el.startElevatorSequence();

        // Make testing fist weapon.
        // this.addObjectToWorld(new FistWeapon(this, null, { position: new TwoVector(128, 112) }));

        // this.spawnEnemy({ pos: new TwoVector(10, 20) });

        // Start match in debug mode immediately.
        setTimeout(this.startMatch.bind(this), 100);
    }

    server_playerJoined(ev) {
        // Check which player (1 or 2) is not possessed and possess him.
        // If they are both already possessed, nothing happens (still connected?).
        const player = this.world.queryObject({ playerId: 0 });
        if (player) {
            const players = this.world.queryObjects({ instanceType: Player });
            const actualId = players.indexOf(player);
            console.log(`assigning user_${ev.playerId}@index_${actualId}`);
            player.playerId = ev.playerId;
        }
    }

    server_playerDisconnected(ev) {
        const player = this.world.queryObject({ playerId: ev.playerId });
        if (player) {
            const players = this.world.queryObjects({ instanceType: Player });
            const actualId = players.indexOf(player);
            console.log(`invalidating user_${ev.playerId}@index_${actualId}`);
            player.playerId = 0;

            // End the play session for all players.
            for (const p of players) {
                p.isReady = 0;
            }
        }
    }

    markPendingKill(objectId) {
        this.pendingKill.push(objectId);
    }

    /** [server] */
    spawnEnemy(options) {
        console.log('spawning test enemy', typeof options.pos);
        const enemy = new AlienGoon(this, { id: 120 }, {
            position: new TwoVector(200, 0)
        });

        const weapon = new FistWeapon(this, null, null);
        this.addObjectToWorld(weapon);

        enemy.pickupWeapon(weapon.id);
        this.addObjectToWorld(enemy);
    }

    client_init() {
        if (!this.renderer) {
            throw new Error('renderer invalid on client function');
        }

        // Bind controls
        this.controls = new KeyboardControls(this.renderer.clientEngine);
        this.controls.bindKey(['up', 'w'], 'jump');
        this.controls.bindKey(['left', 'a'], 'left', { repeat: true });
        this.controls.bindKey(['right', 'd'], 'right', { repeat: true });
        this.controls.bindKey('space', 'attack');
        this.controls.bindKey('shift', 'weaponSlot');
        this.controls.bindKey('m', 'debugCollision');

        // setTimeout(() => {
        //     console.log('added object');
        //     this.renderer.clientEngine.sendInput('server_spawnEnemy', {
        //         pos:
        //             new TwoVector(10, 20)
        //     });
        // }, 100);
    }

    client_draw() {
        // Sync to the network replicated game engine.
        // this.renderer.syncToLance(this);
    }

    getPlayerById(playerId) {
        // playerId is the id of an active human player, who may own several objects.
        // We want the Player object itself.
        return this.world.queryObject({ playerId, instanceType: Player });
    }

    getPlayers() {
        // Uncomment if not using players list cache.
        // return this.world.queryObjects({ instanceType: Player });
        if (this.cachedPlayers) { return this.cachedPlayers; }
        const players = this.world.queryObjects({ instanceType: Player });
        if (players.length >= 2) {
            // Save cached players if possible to avoid iterating over
            // all the world actors again.
            this.cachedPlayers = players;
        }
        return players;
    }

    /** The actual index of a player regardless of how many times they joined/left. */
    getPlayerIndex(playerId) {
        return this.getPlayers().findIndex(pl => pl.playerId == playerId);
    }

    /** [client] @returns whether this client can play. Always false on server. */
    isValidClientPlayer() { return this.getPlayerIndex(this.playerId) != -1; }

    /** @returns number of players possessed by valid users */
    getNumValidPlayers() {
        return this.getPlayers().reduce((x, y) => x + (y.playerId != 0 ? 1 : 0), 0);
    }

    test_objectsInRange() {
        const players = this.world.queryObjects({ instanceType: Player });
        const p1 = players[0];
        if (p1) {
            objectsInRange(getNonStaticObjects(this.world), p1.position, 32, [p1]).forEach(
                obj => console.log('player is closer to', obj)
            );
        }
    }
}
