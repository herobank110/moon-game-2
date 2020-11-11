/// <reference types="../types/lance-gg" />
import { GameEngine, GameObject, SimplePhysicsEngine } from "lance-gg";

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

    processInput(inputData, playerId, isServer) {
        super.processInput(inputData, playerId, isServer);

        let player = this.world.queryObject({ playerId: playerId });
        if (player) {
            switch (inputData.input) {
                case "left": break;
                case "right": break;
                case "jump": break;
                case "attack": break;
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
        const player = this.world.queryObject({ playerId: null });
        if (player) {
            console.log('assigning player to new', playerId);
            player.playerId = ev.playerId;
            this.
        } else {
            console.log('not more un-possessed players');
        }

        // const players = this.world.queryObjects({ instanceType: Player });
        // if (players[0].playerId === null) {
        //     players[0].playerId = ev.playerId;
        // } else if (players[1].playerId === null) {
        //     players[1].playerId = ev.playerId;
        // }
    }

    server_playerDisconnected(ev) {
        const player = this.world.queryObject({ playerId: ev.playerId });
        if (player) {
            console.log('removed player id from', ev.playerId);
            player.playerId = null;
        } else {
            console.log('no such player exists', ev.playerId);
        }
        // let players = this.world.queryObjects({ instanceType: Player });
        // if (players[0].playerId === ev.playerId) {
        //     players[0].playerId = null;
        // } else if (players[1].playerId === ev.playerId) {
        //     players[1].playerId = null;
        // }
    }

    client_init() {
        // this.controls = new KeyboardControls(this.renderer.clientEngine);
        // this.controls.bindKey("up", "up", { repeat: true });
        // this.controls.bindKey("w", "up", { repeat: true });

        // this.controls.bindKey("left", "left", { repeat: true });
        // this.controls.bindKey("a", "left", { repeat: true });

        // this.controls.bindKey("right", "right", { repeat: true });
        // this.controls.bindKey("d", "right", { repeat: true });
    }

    client_draw() {
        // Sync to the network replicated game engine.
        // this.renderer.syncToLance(this);
    }
}
