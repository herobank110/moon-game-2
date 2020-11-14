/// <reference types='../types/lance-gg' />
import { DynamicObject, GameEngine, KeyboardControls, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import { closestObject, getNonStaticObjects, objectsInRange } from '../utils/lanceUtils';
import { hasAuthority } from '../utils';
import Player from '../pawns/player';
import FistWeapon from '../weapons/fistWeapon';
import WeaponBase from './baseWeapon';
import BasePawn from './basePawn';
import { test_Enemy } from '../pawns/test_enemy';

export default class MoonEngine extends GameEngine {
    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({
            gameEngine: this,
            gravity: new TwoVector(0, 0.045),
            collisions: { autoResolve: true }
        });

        this.on('postStep', this.stepLogic.bind(this));
        this.on('server__init', this.server_init.bind(this));
        this.on('server__playerJoined', this.server_playerJoined.bind(this));
        this.on('server__playerDisconnected', this.server_playerDisconnected.bind(this));
        this.on('client__rendererReady', this.client_init.bind(this));
        this.on('client__draw', this.client_draw.bind(this));
        // this.on('collisionStart', (ev) => {
        //     // if (ev.o1 instanceof Player) {
        //     //     ev.o1.position.y = 300;
        //     //     ev.o1.velocity.y = 0;
        //     // }
        // });
        // this.on('collisionStop', (ev) => { console.log('collision started', ev); })
    }

    registerClasses(serializer) {
        super.registerClasses(serializer);
        serializer.registerClass(Player);
        serializer.registerClass(DynamicObject);
        serializer.registerClass(FistWeapon);
        serializer.registerClass(test_Enemy);
    }

    stepLogic() {
        const grabItemRange = 32;
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
        this.addObjectToWorld(new Player(this, null, { position: new TwoVector(96, 112) }));
        this.addObjectToWorld(new Player(this, null, { position: new TwoVector(32, 112) }));

        // Make invisible walls.
        const invisibleWalls = [
            { x: 0, y: 128, w: 1000000, h: 64 },
            { x: 0, y: 0, w: 16, h: 128 }
        ];

        for (const rect of invisibleWalls) {
            this.addObjectToWorld(new DynamicObject(this, null, {
                isStatic: 1, position: new TwoVector(rect.x, rect.y),
                width: rect.w, height: rect.h
            }));
        }

        // Make testing fist weapon.
        this.addObjectToWorld(new FistWeapon(this, null, { position: new TwoVector(128, 112) }));
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
        }
    }

    /** [server] */
    spawnEnemy(options) {
        console.log('spawning test enemy', typeof options.pos);
        this.addObjectToWorld(new test_Enemy(this, { id: 120 }, {
            position: new TwoVector(200, 0)
        }));
    }

    client_init() {
        if (!this.renderer) {
            throw new Error('renderer invalid on client function');
        }

        this.controls = new KeyboardControls(this.renderer.clientEngine);
        this.controls.bindKey(['up', 'w'], 'jump');
        this.controls.bindKey(['left', 'a'], 'left', { repeat: true });
        this.controls.bindKey(['right', 'd'], 'right', { repeat: true });
        this.controls.bindKey('space', 'attack');
        this.controls.bindKey('shift', 'weaponSlot');
        this.controls.bindKey('m', 'debugCollision');

        setTimeout(() => {
            console.log('added object');
            this.renderer.clientEngine.sendInput('server_spawnEnemy', {
                pos:
                    new TwoVector(10, 20)
            });
        }, 100);
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
