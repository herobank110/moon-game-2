import { DynamicObject, TwoVector } from "lance-gg";
import { check, hasAuthority } from "../utils";
import { makeInvisibleWall } from "../utils/lanceUtils";
import MoonEngine from "./moonEngine";

export default class Elevator extends DynamicObject {
    static get netScheme() { return super.netScheme; }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        /** [server] Walls as object references not IDs. */
        this.walls = [];
        this.startPos = new TwoVector(0, 0);
        this.endPos = new TwoVector(0, 0);
        /** @type {MoonEngine} */
        this.gameEngine = gameEngine;

        this.gameEngine.on('postStep', this.tick.bind(this));
    }

    /** [server] start an animated elevator descent. */
    startElevatorSequence() {
        check(hasAuthority(), 'must only startElevatorSequence on server');

        // Make the elevator collision walls.
        for (const rect of [
            { x: this.startPos.x,      y: this.startPos.y,      w: 112, h: 16 },
            { x: this.startPos.x,      y: this.startPos.y + 64, w: 112, h: 16 },
            { x: this.startPos.x,      y: this.startPos.y,      w: 16,  h: 64 },
            { x: this.startPos.x + 96, y: this.startPos.y,      w: 16,  h: 64 }
        ]) {
            const obj = this.gameEngine.addObjectToWorld(makeInvisibleWall(this.gameEngine, rect));
            this.walls.push(obj);
        }

        // Put players in the elevator.
        const players = this.gameEngine.getPlayers();
        check(players.length == 2, 'must be 2 players for elevator to start');
        players[0].position.set(this.startPos.x + 16 * 1, this.startPos.y + 16);
        players[1].position.set(this.startPos.x + 16 * 3, this.startPos.y + 16);
    }

    /** Assumes constant tick rate. Must call startElevatorSequence() first. */
    tick() {
        // TODO do elevator descent sequence
    }

    onRemoveFromWorld(gameEngine) {
        super.onRemoveFromWorld(gameEngine);

        // Also remove dangling refs to walls from world.
        for (const obj of this.walls) {
            gameEngine.removeObjectFromWorld(obj.id)
        }
    }

    syncTo(other) { super.syncTo(other); }
}