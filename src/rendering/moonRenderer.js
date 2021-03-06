import $ from 'jquery';
import { DynamicObject, Renderer, TwoVector } from 'lance-gg';
import { Actor, Color, Engine as ExEngine, Loader, LockCameraToActorStrategy, Scene, SpriteSheet, TileMap, TileSprite, Vector } from 'excalibur';
import resources from './resources';
import Player from '../pawns/player';
import FistWeapon from '../weapons/fistWeapon';
import { getCameraFocalPoint } from './cameraFocalPoint';
import { makeLiftOffMenu, makeLoseMenu, makeMatchHaltMenu, makeTooManyPlayersMenu, makeTutorialDialog, makeWaitingForPlayerMenu, makeWinMenu } from '../menus/mainMain';
import MoonEngine from '../core/moonEngine';
import { check } from '../utils';
import { AUDIO_VOLUME, MENU_ROOT, NO_LOGO } from "../utils/constants";
import Elevator from '../core/elevator';
import { AlienBoss, AlienGoon } from '../pawns/aliens';

/** 
 * @param {TwoVector} l
 * @param {Vector} e
 */
const l2e_pos = (l, e) => void e.setTo(l.x, l.y);


const worldAtlasRows = 3;
const worldAtlasColumns = 5;

export default class MoonRenderer extends Renderer {
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.showCollision = false;

        /** @type {MoonEngine} */
        this.gameEngine = gameEngine;
        this.isExcaliburReady = false;

        this.excaliburShadowQueue = [];

        /** @type {{lanceId: number, front: Actor, back: Actor}[]}} */
        this.exElevators = [];
        /** @type {{lanceId: number, exActor: Actor}[]} */
        this.exBasicActors = [];
        /** @type {{lanceId: number, exActor: Actor}[]} */
        this.exPlayers = [];

        gameEngine.on('matchStart', () => {
            $(MENU_ROOT).empty();
            if (!NO_LOGO) {
                // Show the lift off sequence which is labelled 'menu.'
                $(MENU_ROOT).append(makeLiftOffMenu());
                setTimeout(() => {
                    // When the real game starts after introduction.
                    resources.menuMusic.stop();
                    resources.alienRoar.play(AUDIO_VOLUME);
                    resources.battleMusic.loop = true;
                    resources.battleMusic.play(AUDIO_VOLUME);
                    $(MENU_ROOT).append(makeTutorialDialog());
                }, 41000);
            }
        });
        gameEngine.on('matchHalt', () => {
            $(MENU_ROOT).empty().append(makeMatchHaltMenu());
            resources.alienRoar.play(AUDIO_VOLUME);
        });
        gameEngine.on('matchWin', () => {
            $(MENU_ROOT).empty().append(makeWinMenu());
        });
        gameEngine.on('matchLose', () => {
            $(MENU_ROOT).empty().append(makeLoseMenu());
            resources.alienRoar.play(AUDIO_VOLUME);
        });
    }

    init() {
        // GameEngine's world may not be valid yet so wait for some network updates.
        setTimeout(() => {
            /** @ts-ignore @type {MoonEngine} */
            const ge = this.gameEngine;
            if (ge.getNumValidPlayers() > 2 && !ge.isValidClientPlayer()) {
                // No need to load assets if its unplayable.
                $(MENU_ROOT).append(makeTooManyPlayersMenu());
                this.clientEngine.disconnect();
            } else {
                // Create the excalibur engine which comes with loading bar.
                this.initExcalibur();
            }
        }, 500);
        return super.init();
    }

    initExcalibur() {
        this.excaliburEngine = new ExEngine({
            antialiasing: false,
            backgroundColor: Color.fromHex('#eeeeee')
        });

        const loader = new Loader(Object.values(resources));
        loader.backgroundColor = this.excaliburEngine.backgroundColor.toHex();
        loader.loadingBarColor = Color.Black;
        loader.logo = './splash_screen.png';
        loader.logoHeight = 720;
        loader.logoWidth = 1280;
        loader.logoPosition = new Vector(0, 0);
        loader.startButtonFactory = () =>
            // @ts-ignore
            $('<button>').text('Start').addClass('btn btn-light').get(0);

        this.excaliburEngine.start(loader)
            .then(() => {
                // Shadow the queued lance objects in excalibur.
                setTimeout(() => {
                    this.excaliburShadowQueue.forEach(this.tryCreateExcaliburShadow.bind(this));
                    this.excaliburShadowQueue = null;
                    this.isExcaliburReady = true;
                }, 10);
                this.setupExcaliburScene();
                this.excaliburEngine.backgroundColor = Color.Black;

                /** @ts-ignore @type {MoonEngine} */
                const ge = this.gameEngine;

                // Declare this player as ready having loaded and clicked start.
                ge.callOnServer('setPlayerReady', { playerId: this.gameEngine.playerId });
                check(!ge.canStartMatch(), 'should not be possible to have already started match as callOnServer takes time');

                if (!NO_LOGO) {
                    $(MENU_ROOT).append(makeWaitingForPlayerMenu());
                    resources.menuMusic.loop = true;
                    resources.menuMusic.play(AUDIO_VOLUME);
                }
            });
    }

    addObject(obj) {
        super.addObject(obj);
        if (this.isExcaliburReady) {
            this.tryCreateExcaliburShadow(obj);
        } else {
            this.excaliburShadowQueue.push(obj);
        }
    }

    tryCreateExcaliburShadow(obj) {
        if (obj instanceof Player) {
            const plIndex = this.gameEngine.getPlayerIndex(obj.playerId);
            const s = plIndex == 0
                ? new SpriteSheet(resources.character1, 6, 5, 16, 16)
                : new SpriteSheet(resources.character2, 6, 5, 20, 16);
            const a = new Actor(0, 0, 32, 32);
            a.onInitialize = function (engine) {
                this.addDrawing('walk_r', s.getAnimationBetween(engine, 0, 6, 60));
                this.addDrawing('walk_l', s.getAnimationBetween(engine, 6, 12, 60));
                this.addDrawing('idle_r', s.getAnimationBetween(engine, 12, 18, 125));
                this.addDrawing('idle_l', s.getAnimationBetween(engine, 18, 24, 125));
                this.addDrawing('attack_r', s.getSprite(24));
                this.addDrawing('attack_l', s.getSprite(25));
                this.setDrawing('idle_r');
            };
            this.excaliburEngine.add(a);
            a.anchor.setTo(0, 0);
            a.setZIndex(2);
            this.exPlayers.push({ lanceId: obj.id, exActor: a });
        } else if (obj instanceof FistWeapon) {
            // Add a fist actor.
        } else if (obj instanceof Elevator) {
            const back = new Actor(0, 0, 224, 128);
            back.anchor.setTo(0, 0);
            back.onInitialize = _engine => {
                back.addDrawing(resources.elevatorBack);
            };
            this.excaliburEngine.add(back);
            setTimeout(() => {
            }, 100)

            const front = new Actor(0, 0, 224, 128);
            front.anchor.setTo(0, 0);
            front.onInitialize = _engine => {
                front.addDrawing(resources.elevatorFront);
            };
            this.excaliburEngine.add(front);
            front.setZIndex(999);  // Must be in scene to set Z index.

            this.exElevators.push({ lanceId: obj.id, front, back });
        } else if (obj instanceof AlienGoon) {
            const actor = new Actor(0, 0, 32, 32);
            actor.anchor.setTo(0, 0);
            actor.onInitialize = _engine => {
                // Stateless static alien sprite.
                // TODO add movement and idle animations
                actor.addDrawing(resources.alien1);
            }
            this.excaliburEngine.add(actor);
            this.exBasicActors.push({ lanceId: obj.id, exActor: actor });
        } else if (obj instanceof AlienBoss) {
            const actor = new Actor(0, 0, 32, 32);
            actor.anchor.setTo(0, 0);
            actor.onInitialize = _engine => {
                actor.addDrawing(resources.alienBoss);
            }
            this.excaliburEngine.add(actor);
            this.exBasicActors.push({ lanceId: obj.id, exActor: actor });
        }
    }

    draw(t, dt) {
        super.draw(t, dt);

        /**
         * @param {number} lanceId
         * @param {Actor[]} exSlaves
         */
        const l2e = (lanceId, ...exSlaves) => {
            const lanceObj = this.gameEngine.objectById(lanceId);
            // Lance Ids can be invalidated if the objects is destroyed on server.
            if (lanceObj) {
                exSlaves.forEach(e => {
                    l2e_pos(lanceObj.position, e.pos);
                });
            } else {
                // The lance object has been destroyed.
                exSlaves.forEach(e => this.excaliburEngine.remove(e));
            }
        }

        // TODO remove this dead code
        // const fist = this.gameEngine.world.queryObject({ instanceType: FistWeapon });
        // if (fist && this.fist) {
        //     l2e_pos(fist.position, this.fist.pos);
        //     // Only show world weapon pickup if not wielded.
        //     this.fist.visible = !fist.isWielded();
        // }

        if (this.cameraFocalPoint) {
            // Previously newPos.y was shaky due to lance-gg network interpolation.
            const newPos = getCameraFocalPoint(this.gameEngine);
            if (NO_LOGO) {
                // Track player1 if in debug mode.
                const p = this.gameEngine.getPlayers();
                if (p.length >= 2) {
                    newPos.copy(p[0].position);
                }
            }
            this.cameraFocalPoint.pos.setTo(newPos.x, newPos.y);
        }

        // Do 'basic' actors (most normal actors).
        for (const { lanceId, exActor } of this.exBasicActors) {
            l2e(lanceId, exActor);
        }

        // Do players.
        for (const x of this.exPlayers) {
            if (x.exActor.isInitialized) {
                /** @ts-ignore @type {Player} */
                const a = this.gameEngine.objectById(x.lanceId);
                x.exActor.setZIndex(2);
                l2e_pos(a.position, x.exActor.pos);
                x.exActor.setDrawing(this.getAnimState(a));
            }
        }

        // Do elevators.
        for (const x of this.exElevators) {
            /** @ts-ignore @type {Elevator} */
            const e = this.gameEngine.objectById(x.lanceId);
            // Just in case this is ever null.
            if (e) {
                this.excaliburEngine.currentScene.camera.zoom(e.isElevating ? 10 : 6);
                l2e_pos(e.position, x.back.pos);
                l2e_pos(e.position, x.front.pos);
                x.front.setZIndex(999);  // Seems Z index has to be set each frame.
            }
        }
        // Auto play elevator music (audio is rendering!?).
        const anyElevating = this.gameEngine.getActiveElevator() !== null;
        if (anyElevating) {
            // Without checks it causes glitching.
            if (!resources.elevatorMusic.isPlaying()) {
                resources.elevatorMusic.play();
                resources.battleMusic.stop();
            }
        } else if (resources.elevatorMusic.isPlaying()) {
            resources.elevatorMusic.stop();
            if (!NO_LOGO) {
                resources.battleMusic.play();
            }
        }

        $('.collision-box').remove();
        if (this.showCollision) {
            $(MENU_ROOT).append(
                this.gameEngine.world.queryObjects({ instanceType: DynamicObject }).map(obj => {
                    const bl = this.excaliburEngine.worldToScreenCoordinates(new Vector(obj.position.x, obj.position.y));
                    const tr = this.excaliburEngine.worldToScreenCoordinates(new Vector(obj.position.x + obj.width, obj.position.y + obj.height));
                    const sz = tr.sub(bl);
                    return $('<div>').addClass('collision-box').css({
                        position: 'absolute',
                        left: `${bl.x}px`, top: `${bl.y}px`,
                        width: `${Math.abs(sz.x)}px`, height: `${Math.abs(sz.y)}px`,
                        border: `solid 1px ${(obj.isStatic ? Color.Magenta : Color.Orange).toHex()}`
                    });
                })
            );
        }
    }

    toggleShowCollision() {
        this.showCollision = !this.showCollision;
    }

    /** 
     * @param {Player} player
     * @returns excalibur drawing key for a player.
     */
    getAnimState(player) {
        if (player.velocity.length() < 0.01 || player.isInAir()) {
            // Player is nearly stopped.
            return player.isFacingRight ? 'idle_r' : 'idle_l';
        }
        return player.isFacingRight ? 'walk_r' : 'walk_l';
    }

    setupExcaliburScene() {
        const scene = new Scene(this.excaliburEngine);
        scene.camera.zoom(6);

        // Add the world tile map.
        const tileMap = new TileMap({
            x: 0, y: -128,
            cellWidth: 16, cellHeight: 16,
            rows: 1000, cols: 10000
        });
        tileMap.registerSpriteSheet('world', new SpriteSheet(resources.world, worldAtlasColumns, worldAtlasRows, 16, 16));
        tileMap.registerSpriteSheet('props', new SpriteSheet(resources.staticProps, 3, 1, 16, 16));
        scene.add(tileMap);

        // assumes all sprites in the row use the same sprite.
        const setRowSprite = (row, spr, randomThreshold = 1) => {
            for (let x = 0; x < 10000; x++) {
                if (Math.random() <= randomThreshold) {
                    tileMap.getCell(x, row).pushSprite(spr);
                }
            }
        }

        let i = 0;
        for (const j of [0, 2, 2, 2, 1]) {
            const worldAtlasRowOffset = j * worldAtlasColumns;
            for (const row of [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
                setRowSprite(i++, new TileSprite('world', row + worldAtlasRowOffset));
            }
        }

        // add static props
        setRowSprite(17, new TileSprite('props', 2), 0.1);
        setRowSprite(43, new TileSprite('props', 1), 0.1);
        setRowSprite(69, new TileSprite('props', 0), 0.1);
        setRowSprite(95, new TileSprite('props', 1), 0.1);
        setRowSprite(120, new TileSprite('props', 1), 0.1);
        setRowSprite(121, new TileSprite('props', 0), 0.1);
        setRowSprite(122, new TileSprite('props', 2), 0.1);

        // TODO remove this code
        // add the test fist.
        // const f = this.fist = new Actor(0, 0);
        // f.onInitialize = function (_engine) { this.addDrawing(resources.fist); };
        // f.anchor.setTo(0, 0);
        // testScene.add(f);

        // Add the camera focal point actor without any drawing
        const c = this.cameraFocalPoint = new Actor(0, 0);
        scene.add(c);
        scene.camera.addStrategy(new LockCameraToActorStrategy(c));

        this.excaliburEngine.addScene('default', scene);
        this.excaliburEngine.goToScene('default');
    }
}