import { BaseTypes, DynamicObject, TwoVector } from "lance-gg";
import { check, hasAuthority } from "../utils";
import { NO_LOGO } from "../utils/constants";
import { makeInvisibleWall } from "../utils/lanceUtils";
import MoonEngine from "./moonEngine";

export default class Elevator extends DynamicObject {
    static get netScheme() {
        return Object.assign({
            isElevating: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.isStatic = 1;

        /** [server] Walls as IDs. Object references are killed and reset by lance. */
        this.walls = [];
        this.startPos = new TwoVector(0, 0);
        this.endPos = new TwoVector(0, 0);
        this.duration = NO_LOGO ? 30 : 1000;
        this.animTime = 0;
        /** @type {MoonEngine} */
        this.gameEngine = gameEngine;
        this.isElevating = 0;

        if (this.gameEngine) {
            this.gameEngine.on('postStep', this.tick.bind(this));
        }
    }

    /** [server] start an animated elevator descent. */
    startElevatorSequence() {
        console.log('start elevator called');
        check(hasAuthority(), 'must only startElevatorSequence on server');

        // Make the elevator collision walls.
        for (const rect of [
            { x: this.startPos.x, y: this.startPos.y - 12, w: 112, h: 16 },
            { x: this.startPos.x, y: this.startPos.y + 48, w: 112, h: 16 },
            { x: this.startPos.x, y: this.startPos.y, w: 16, h: 64 },
            { x: this.startPos.x + 96, y: this.startPos.y, w: 16, h: 64 }
        ]) {
            const obj = this.gameEngine.addObjectToWorld(makeInvisibleWall(this.gameEngine, rect));
            this.walls.push(obj.id);
        }

        // Put players in the elevator.
        const players = this.gameEngine.getPlayers();
        check(players.length == 2, 'must be 2 players for elevator to start');
        players[0].position.set(this.position.x + 16 * 2, this.position.y + 16);
        players[1].position.set(this.position.x + 16 * 4, this.position.y + 16);

        // Start animation time.
        this.animTime = this.duration;
        this.isElevating = 1;
    }

    /** Assumes constant tick rate. Must call startElevatorSequence() first. */
    tick() {
        if (hasAuthority() && this.animTime > 0 && this.walls.length == 4) {
            // Do animation step.
            this.animTime--;
            const bias = 1 - (this.animTime / this.duration);
            this.position.copy(this.startPos).lerp(this.endPos, bias);

            // Move collision bounds.
            const w = this.walls.map(this.gameEngine.objectById.bind(this.gameEngine));
            w[0]?.position.set(this.position.x, this.position.y - 12);
            w[1]?.position.set(this.position.x, this.position.y + 48);
            w[2]?.position.set(this.position.x, this.position.y);
            w[3]?.position.set(this.position.x + 96, this.position.y);

            // TODO remove dead code, already set in client... somewhere!
            // Force player position as lance interpolation is terrible.
            // Seems clients will fail to move the player as it goes through the
            // collision walls.
            // const players = this.gameEngine.getPlayers();
            // players[0].position.set(this.position.x + 16 * 2, this.position.y + 16);
            // players[1].position.set(this.position.x + 16 * 4, this.position.y + 16);

            if (this.animTime == 0) {
                // Ended animation this frame.
                setTimeout(() => {
                    for (const w of this.walls) {
                        this.gameEngine.markPendingKill(w);
                        this.isElevating = 0;
                    }
                    // Reset the walls array for less confusion.
                    this.walls.splice(0, this.walls.length);
                }, 500);
            }
        } else if (hasAuthority()) {
            this.isElevating = 0;
        }
    }

    onRemoveFromWorld(gameEngine) {
        super.onRemoveFromWorld(gameEngine);

        // Also remove dangling refs to walls from world.
        for (const obj of this.walls) {
            gameEngine.removeObjectFromWorld(obj)
        }
    }

    syncTo(other) {
        this.isElevating = other.isElevating;
        super.syncTo(other);
    }

    /**
     * @param {TwoVector} position
     * @returns whether a position in in elevator bounds
     */
    isInElevator(position) {
        return (
            this.position.x < position.x && position.x < this.position.x + 112
            && this.position.y < position.y && position.y < this.position.y + 64
        );
    }
}