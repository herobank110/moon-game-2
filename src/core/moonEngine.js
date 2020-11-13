/// <reference types='../types/lance-gg' />
import { DynamicObject, GameEngine, KeyboardControls, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import { getNonStaticObjects, objectsInRange } from '../utils';
import Player from './player';

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
    }

    stepLogic() {
        // this.testObjectsInRange();
    }

    processInput(inputDesc, playerId, isServer) {
        super.processInput(inputDesc, playerId, isServer);

        // Replicated function callers.
        if (isServer) {
            // This can be caused with callOnServer()
            const serverMatch = inputDesc.input.match(/server_(.*)/);
            if (serverMatch) return void this[serverMatch[1]](inputDesc.options);
        } else {
            // Idk how to invoke this behaviour on clients!
            const clientMatch = inputDesc.input.match(/client_(.*)/);
            if (clientMatch) return void this[clientMatch[1]](inputDesc.options);
        }

        const player = this.world.queryObject({ playerId, instanceType: Player });
        if (player) {
            switch (inputDesc.input) {
                case 'left': player.moveLeft(); break;
                case 'right': player.moveRight(); break;
                case 'jump': player.jump(); break;
                case 'attack': player.attack(); break;
                // @ts-ignore
                case 'debugCollision': this.renderer?.toggleShowCollision(); break;
                default: throw new Error('invalid input action. See: MoonEngine::processInput');
            }
        }
    }

    callOnServer(funcName, options) {
        if (this.hasAuthority()) {
            // Already the server. Call locally.
            return void this[funcName](options);
        }
        // this is the client.
        this.renderer.clientEngine.sendInput('server_' + funcName, options);
    }

    hasAuthority() { return this.renderer === undefined; }

    server_init() {
        this.addObjectToWorld(new Player(this, null, {
            width: 16,
            height: 16,
            position: new TwoVector(96, 112),
        }));
        this.addObjectToWorld(new Player(this, null, {
            width: 16,
            height: 16,
            position: new TwoVector(32, 112),
        }));

        const floor = this.addObjectToWorld(new DynamicObject(this, { id: 69 }, {
            height: 16,
            width: 1000000,
            isStatic: 1,
            position: new TwoVector(0, 128)
        }));

        // Make invisible walls.
        const invisibleWalls = [
            { x: 0, y: 0, w: 16, h: 128 }
        ];

        for (const rect of invisibleWalls) {
            this.addObjectToWorld(new DynamicObject(this, null, {
                isStatic: 1, position: new TwoVector(rect.x, rect.y), width: rect.w, height: rect.h
            }));
        }

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
        console.log('spawning enemy', typeof options.pos);
        this.addObjectToWorld(new DynamicObject(this, { id: 120 }, { height: 100 }));
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
        this.controls.bindKey('m', 'debugCollision');

        setTimeout(() => {
            console.log('added object');
            this.renderer.clientEngine.sendInput('server_spawnEnemy', {pos:
            new TwoVector(10, 20)});
        }, 100);
    }

    client_draw() {
        // Sync to the network replicated game engine.
        // this.renderer.syncToLance(this);
    }

    testObjectsInRange() {
        const players = this.world.queryObjects({ instanceType: Player });
        const p1 = players[0];
        if (p1) {
            objectsInRange(getNonStaticObjects(this.world), p1.position, 32, [p1]).forEach(
                obj => console.log('player is closer to', obj)
            );
        }
    }
}
