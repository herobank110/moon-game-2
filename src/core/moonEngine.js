/// <reference types="../types/lance-gg" />
import { GameEngine, KeyboardControls, SimplePhysicsEngine, TwoVector } from "lance-gg";
import Player from "./player";

export default class MoonEngine extends GameEngine {
    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({ gameEngine: this });

        this.on('postStep', this.stepLogic.bind(this));
        this.on('server__init', this.server_init.bind(this));
        this.on('server__playerJoined', this.server_playerJoined.bind(this));
        this.on('server__playerDisconnected', this.server_playerDisconnected.bind(this));
        this.on('client__rendererReady', this.client_init.bind(this));
        this.on('client__draw', this.client_draw.bind(this));
    }

    registerClasses(serializer) {
        serializer.registerClass(Player);
    }

    stepLogic() {
        // const players = this.world.queryObjects({ instanceType: Player });
    }

    processInput(inputDesc, playerId, isServer) {
        super.processInput(inputDesc, playerId, isServer);

        const player = this.world.queryObject({ playerId, instanceType: Player });
        if (player) {
            switch (inputDesc.input) {
                case 'left': player.moveLeft(); break;
                case 'right': player.moveRight(); break;
                case 'jump': player.jump(); break;
                case 'attack': player.attack(); break;
                default: throw new Error('invalid input action. See: MoonEngine::processInput');
            }
        }
    }

    server_init() {
        this.addObjectToWorld(new Player(this, null, {
            position: new TwoVector(10, 0),
        }));
        this.addObjectToWorld(new Player(this, null, {
            position: new TwoVector(10, 0),
        }));
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

    client_init() {
        if (!this.renderer) {
            throw new Error('renderer invalid on client function');
        }

        this.controls = new KeyboardControls(this.renderer.clientEngine);
        this.controls.bindKey(['up', 'w'], 'jump');
        this.controls.bindKey(['left', 'a'], 'left', { repeat: true });
        this.controls.bindKey(['right', 'd'], 'right', { repeat: true });
        this.controls.bindKey('space', 'attack');
    }

    client_draw() {
        // Sync to the network replicated game engine.
        // this.renderer.syncToLance(this);
    }
}
