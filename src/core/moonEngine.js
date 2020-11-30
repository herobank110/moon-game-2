/// <reference types='../types/lance-gg' />
import { DynamicObject, GameEngine, KeyboardControls, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import { closestObject, getNonStaticObjects, makeInvisibleWall, objectsInRange } from '../utils/lanceUtils';
import { check, hasAuthority } from '../utils';
import Player from '../pawns/player';
import FistWeapon from '../weapons/fistWeapon';
import WeaponBase from './baseWeapon';
import { AlienBoss, AlienGoon } from '../pawns/aliens';
import Elevator from './elevator';
import { NO_LOGO, R } from '../utils/constants';

/** Range for players to grab items. */
const grabItemRange = 32;

/** Defines the invisible walls that are only ever made once. */
const wallsConfig = [
    /* left wall  */ { x: 16, /*  */ y: 0, /*   */ w: 16, /* */ h: 128 },
    /* top floor  */ { x: 0, /*   */ y: 128, /* */ w: 256, /**/ h: 500 },
    /* 2nd floor  */ { x: 256, /* */ y: 544, /* */ w: 256, /**/ h: 500 },
    /* 3rd floor  */ { x: 512, /* */ y: 960, /* */ w: 256, /**/ h: 500 },
    /* 4th floor  */ { x: 768, /* */ y: 1376, /**/ w: 256, /**/ h: 500 },
    /* boss floor */ { x: 1024, /**/ y: 1792, /**/ w: 256, /**/ h: 500 },
];

/** Elevators. Config ONLY!! */
const elevatorsConfig = [
    /* top - 2nd  */ { x: 256, /* */ y1: 64, /*  */ y2: 480 },
    /* 2nd - 3rd  */ { x: 512, /* */ y1: 480, /* */ y2: 896 },
    /* 3rd - 4th  */ { x: 768, /* */ y1: 896, /* */ y2: 1312 },
    /* 4th - boss */ { x: 1024, /**/ y1: 1312, /**/ y2: 1728 },
];

/** Aliens, config per floor level. */
const aliensConfig = [
    /* top floor */[
        { cls: AlienBoss, weaponCls: FistWeapon, x: 48, y: 100 }
    ],
    /* 2nd floor  */[
    ],
    /* 3rd floor  */[
    ],
    /* 4th floor  */[
    ],
    /* boss floor */[
        // { cls: AlienBoss, weaponCls: FistWeapon, x: 1100, y: 1750 }
    ],
]

/** Players 1 and 2 start locations. */
const playersConfig = [
    { x: 96, y: 112 },
    { x: 48, y: 112 },
];

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
        this.hasMatchEnded = false;

        /** @type {number[]} ids of created elevators */
        this.elevators = [];

        /** @type {number[][]} ids of aliens per level */
        this.aliens = [];

        /** @type {number[]} ids of transient match actors to kill in resetMatch */
        this.transientActors = [];

        this.on('postStep', this.stepLogic.bind(this));
        this.on('server__init', this.server_init.bind(this));
        this.on('server__playerJoined', this.server_playerJoined.bind(this));
        this.on('server__playerDisconnected', this.server_playerDisconnected.bind(this));
        this.on('client__rendererReady', this.client_init.bind(this));
        // My custom events.
        this.on('matchStart', this.startMatch.bind(this));

        if (!hasAuthority()) {
            // Disconnect client when the match is lost.
            const disconnectSelf = () => this.renderer.clientEngine.disconnect();
            this.on('matchLose', disconnectSelf);
            this.on('matchHalt', disconnectSelf);
            this.on('matchFinalize', disconnectSelf);
        }
    }

    registerClasses(serializer) {
        super.registerClasses(serializer);
        serializer.registerClass(AlienBoss);
        serializer.registerClass(AlienGoon);
        serializer.registerClass(DynamicObject);
        serializer.registerClass(Elevator);
        serializer.registerClass(FistWeapon);
        serializer.registerClass(Player);
    }

    stepLogic() {
        // Check match start logic.
        if (this.canStartMatch()) {
            // Each client will be slightly out of sync with this, but that's ok.
            this.emit('matchStart');
        } else if (this.canHaltMatch()) {
            // Match became invalidated during play (someone left).
            if (hasAuthority()) { this.resetMatch(); }
            this.emit('matchHalt');
        } else if (this.canWinMatch()) {
            // Match is now complete!
            this.hasMatchEnded = true;
            this.emit('matchWin');
        } else if (this.canLoseMatch()) {
            // Match lost!
            this.hasMatchEnded = true;
            this.emit('matchLose');
        } else if (this.canFinalizeMatch()) {
            // Match finalized!
            if (hasAuthority()) { this.resetMatch(); }
            this.emit('matchFinalize');
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
        this.cullObjects();

        if (hasAuthority()) {
            this.autoStartElevators();
        }
    }

    /** Start a new match once all players are joined and ready. */
    startMatch() {
        console.log('started match');
        this.hasMatchStarted = true;
        if (hasAuthority()) {
            this.makeElevators();
            this.makeAliens();
        }
    }

    /** [server] reset the match state for new players to join
     * 
     * (clients should have left already)
     */
    resetMatch() {
        console.log('match resettled');
        // Invalidate player IDs.
        const players = this.getPlayers();
        check(players.length >= 2, 'must be 2 players to reset match');
        check(playersConfig.length >= 2, 'must be 2 player configs to reset match');
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            p.playerId = 0;
            // @ts-ignore BasePawn has static get initialHealth
            p.health = p.constructor.initialHealth;
            p.position.set(playersConfig[i].x, playersConfig[i].y);
        }

        this.hasMatchStarted = false;
        this.hasMatchEnded = false;

        // Kill transient actors (enemies, weapons, etc)
        this.transientActors.forEach(id => this.markPendingKill(id));

        this.elevators.splice(0, this.elevators.length);
        this.aliens.splice(0, this.aliens.length);
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
        return (!this.hasMatchStarted
            && !this.hasMatchEnded
            && players.length == 2
            && (NO_LOGO
                ? players.some(p => p.isReady)
                : players.every(p => p.isReady)));
    }

    /** Halt when a player (or both) disconnect. */
    canHaltMatch() {
        const players = this.getPlayers();
        return (this.hasMatchStarted
            && !this.hasMatchEnded
            // Could be that not all players created on client yet.
            && players.length == 2
            && (NO_LOGO
                ? players.every(p => !p.isReady)
                : players.some(p => !p.isReady)
            )
        );
    }

    /** Win match when the match started and the boss is dead. */
    canWinMatch() {
        const boss = this.world.queryObject({ instanceType: AlienBoss });
        return (this.hasMatchStarted
            && !this.hasMatchEnded
            && (!boss || boss.isDead()));
    }

    /** Lose when match started and a player is dead. */
    canLoseMatch() {
        const players = this.getPlayers();
        return (this.hasMatchStarted
            && !this.hasMatchEnded
            && players.some(p => p.isDead()));
    }

    /** Reset match state after a win, after someone disconnected. */
    canFinalizeMatch() {
        const players = this.getPlayers();
        return (this.hasMatchStarted
            && this.hasMatchEnded
            // Could be that not all players created on client yet.
            && players.length == 2
            && (NO_LOGO
                ? players.every(p => !p.isReady)
                : players.some(p => !p.isReady)
            )
        );
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

    server_init() {
        const p1 = new Player(this, { id: R.id.player1 }, null);
        this.addObjectToWorld(p1);
        const p2 = new Player(this, { id: R.id.player2 }, null);
        this.addObjectToWorld(p2);

        // Grant player weapons from the start.
        const w1 = new FistWeapon(this, null, { position: new TwoVector(0, 0) });
        this.addObjectToWorld(w1);
        const w2 = new FistWeapon(this, null, { position: new TwoVector(0, 0) });
        this.addObjectToWorld(w2);
        p1.pickupWeapon(w1.id);
        p2.pickupWeapon(w2.id);

        // Make invisible walls.
        for (const rect of wallsConfig) {
            this.addObjectToWorld(makeInvisibleWall(this, rect));
        }

        // Reset all properties state to avoid duplication.
        this.resetMatch();

        // TODO remove below testing code

        // test start elevator now
        // setTimeout(() => el.startElevatorSequence(), 4000);

        // Make testing fist weapon.
        // this.addObjectToWorld(new FistWeapon(this, null, { position: new TwoVector(128, 112) }));

        // this.spawnEnemy({ pos: new TwoVector(10, 20) });

        // Start match in debug mode immediately.
        // setTimeout(this.startMatch.bind(this), 100);
        // End the match after 10 seconds to test match reset state.
        // setTimeout(() => {
        //     console.log('ending match TEST');
        //     this.resetMatch();
        //     this.startMatch();
        // }, 10000);
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
            // if (NO_LOGO) {
            //     this.resetMatch();
            // }
        }
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

    /** [server] Create elevator objects for each match */
    makeElevators() {
        for (const { x, y1, y2 } of elevatorsConfig) {
            const el = new Elevator(this, null, null);
            el.startPos.copy(el.position.set(x, y1));
            el.endPos.set(x, y2);
            this.addObjectToWorld(el);

            // Set ID back in the config only ref.
            this.elevators.push(el.id);

            // Destroyed on match end. Must make at match start!
            this.markTransient(el.id);
        }
    }

    /** [server] Create alien object instances for each match */
    makeAliens() {
        check(this.aliens.length == 0, 'aliens array should be empty to create new ones');
        for (const level of aliensConfig) {
            const i = this.aliens.push([]) - 1;
            for (const { cls, weaponCls, x, y } of level) {
                const alien = new cls(this, null, null);
                alien.position.set(x, y);
                this.addObjectToWorld(alien);
                this.markTransient(alien.id);

                const weapon = new weaponCls(this, null, null);
                this.addObjectToWorld(weapon);
                this.markTransient(weapon.id);
                alien.pickupWeapon(weapon.id);

                this.aliens[i].push(alien.id);
            }
        }
    }

    /** [server] start the elevator that player(s) are close to */
    autoStartElevators() {
        const players = this.getPlayers();
        const playersPred = (NO_LOGO ? players.some : players.every).bind(players);
        const i = elevatorsConfig
            .findIndex(el => playersPred(pl => el.x - 16 <= pl.position.x && pl.position.x <= el.x - 2));
        if (i != -1) {
            /** @ts-ignore @type {Elevator} */
            const elevator = this.objectById(this.elevators[i]);
            elevator.startElevatorSequence();
        }
    }

    // Helper functions.

    /** @param {number} objectId */
    markTransient(objectId) {
        this.transientActors.push(objectId);
    }

    /** @param {number} objectId */
    markPendingKill(objectId) {
        this.pendingKill.push(objectId);
    }

    /** [server] do kill objects marked as pending kill */
    cullObjects() {
        // Check in case the objects have been killed already,
        // otherwise lance throws an error.
        for (const id of this.pendingKill) {
            if (this.objectById(id) !== null) {
                this.removeObjectFromWorld(id);
            }
        }
        // Clear array for next time caching.
        this.pendingKill.splice(0, this.pendingKill.length);
    }

    callOnServer(funcName, options) {
        if (hasAuthority()) {
            // Already the server. Call locally.
            return void this[funcName](options);
        }
        // this is the client.
        this.renderer.clientEngine.sendInput('server_' + funcName, options);
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

    /** Helper to get a DynamicObject (actor) by id. */
    objectById(id) {
        return this.world.queryObject({ id, instanceType: DynamicObject })
    }

    /** @returns currently elevating elevator or null */
    getActiveElevator() {
        return this.world.queryObjects({ instanceType: Elevator })
            .filter(el => el.isElevating)[0] ?? null;
    }

    /** [server] */
    test_spawnEnemy(options) {
        console.log('spawning test enemy', typeof options.pos);
        const enemy = new AlienGoon(this, { id: 120 }, {
            position: new TwoVector(200, 0)
        });

        const weapon = new FistWeapon(this, null, null);
        this.addObjectToWorld(weapon);

        enemy.pickupWeapon(weapon.id);
        this.addObjectToWorld(enemy);
    }
}
