import $ from 'jquery';
import { DynamicObject, Renderer } from 'lance-gg';
import { Actor, Color, Engine as ExEngine, Loader, LockCameraToActorStrategy, Scene, SpriteSheet, TileMap, TileSprite, Vector } from 'excalibur';
import resources from './resources';
import Player from '../pawns/player';
import FistWeapon from '../weapons/fistWeapon';
import CameraFocalPoint from './cameraFocalPoint';
import { makeLiftOffMenu, makeMatchHaltMenu, makeTooManyPlayersMenu, makeWaitingForPlayerMenu } from '../menus/mainMain';
import MoonEngine from '../core/moonEngine';
import { check } from '../utils';
import { NO_LOGO } from "../utils/constants";
import { mapRange } from '../utils/mathUtils';

const worldAtlasRows = 3;
const worldAtlasColumns = 5;
const MENU_ROOT = '#menu-root';

export default class MoonRenderer extends Renderer {
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.showCollision = false;

        gameEngine.on('matchStart', () => {
            $(MENU_ROOT).empty();
            if (!NO_LOGO) {
                // Show the lift off sequence which is labelled 'menu.'
                $(MENU_ROOT).append(makeLiftOffMenu());
            }
        });
        gameEngine.on('matchHalt', () => {
            // Force disconnect when other player disconnects.
            this.clientEngine.disconnect();
            $(MENU_ROOT).empty().append(makeMatchHaltMenu());
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
        loader.logo = './moon-game-splash.png';
        loader.logoHeight = 720;
        loader.logoWidth = 1280;
        loader.logoPosition = new Vector(0, 0);
        loader.startButtonFactory = () =>
            // @ts-ignore
            $('<button>').text('Start').addClass('btn btn-light').get(0);

        this.excaliburEngine.start(loader)
            .then(() => {
                this.test_excaliburScene();

                /** @ts-ignore @type {MoonEngine} */
                const ge = this.gameEngine;

                // Declare this player as ready having loaded and clicked start.
                ge.callOnServer('setPlayerReady', { playerId: this.gameEngine.playerId });
                check(!ge.canStartMatch(), 'should not be possible to have already started match as callOnServer takes time');

                $(MENU_ROOT).append(makeWaitingForPlayerMenu());
            });
    }

    addObject(obj) {
        super.addObject(obj);

        if (obj instanceof Player) {
            // @ts-ignore
            const plIndex = this.gameEngine.getPlayerIndex(obj.playerId);
            console.log(`drawing player ${plIndex} not implemented yet`);
            // TODO Pick sprite sheet and add excalibur actor.
        } else if (obj instanceof FistWeapon) {
            // Add a fist actor.
        }
    }

    draw(t, dt) {
        super.draw(t, dt);

        // Get the first player (testing only!)
        const player = this.gameEngine.world.queryObject({ instanceType: Player });

        if (player && this.a) {
            this.a.pos.setTo(player.position.x, player.position.y);
            this.a.setDrawing(this.getAnimState(player));
        }

        const fist = this.gameEngine.world.queryObject({ instanceType: FistWeapon });
        if (fist && this.fist) {
            this.fist.pos.setTo(fist.position.x, fist.position.y);
            // Only show world weapon pickup if not wielded.
            this.fist.visible = !fist.isWielded();
        }

        const cameraFocalPoint = this.gameEngine.world.queryObject({ instanceType: CameraFocalPoint });
        if (cameraFocalPoint && this.cameraFocalPoint) {
            this.cameraFocalPoint.pos.setTo(cameraFocalPoint.position.x, 60);
            // TODO figure out why cameraFocalPoint y moves up and down so much
            // this.cameraFocalPoint.pos.setTo(cameraFocalPoint.position.x, cameraFocalPoint.position.y);
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

    test_excaliburScene() {
        const a = this.a = new Actor(0, 0);
        a.onInitialize = function (engine) {
            const s = new SpriteSheet(resources.character1, 6, 5, 16, 16);
            this.addDrawing('walk_r', s.getAnimationBetween(engine, 0, 6, 60));
            this.addDrawing('walk_l', s.getAnimationBetween(engine, 6, 12, 60));
            this.addDrawing('idle_r', s.getAnimationBetween(engine, 12, 18, 125));
            this.addDrawing('idle_l', s.getAnimationBetween(engine, 18, 24, 125));
            this.addDrawing('attack_r', s.getSprite(24));
            this.addDrawing('attack_l', s.getSprite(25));
            this.setDrawing('idle_r');
        };
        a.anchor.setTo(0, 0);
        const testScene = new Scene(this.excaliburEngine);
        testScene.add(a);
        testScene.camera.zoom(6);

        setTimeout(() => {
            const viewCenter = this.excaliburEngine.screenToWorldCoordinates(
                new Vector(
                    this.excaliburEngine.screen.halfCanvasWidth,
                    this.excaliburEngine.screen.halfCanvasHeight
                )
            );
            viewCenter.y += mapRange(viewCenter.y / viewCenter.x, 1.7, 2.3, -5, -12);
            testScene.camera.move(viewCenter, 0);
        }, 10);
        // testScene.camera.addStrategy(new LockCameraToActorAxisStrategy(a, Axis.X))
        // TODO make a custom strategy to lock to two players

        // Add the world tile map.
        const tileMap = new TileMap({
            x: 0, y: 0,
            cellWidth: 16, cellHeight: 16,
            rows: 40, cols: 100
        });
        tileMap.registerSpriteSheet('world', new SpriteSheet(resources.world, worldAtlasColumns, worldAtlasRows, 16, 16));
        testScene.add(tileMap);

        // assumes all sprites in the row use the same sprite.
        const setRowSprite = (row, spr, randomThreshold = 1) => {
            for (let x = 0; x < 100; x++) {
                if (Math.random() <= randomThreshold) {
                    tileMap.getCell(x, row).pushSprite(spr);
                }
            }
        }

        let i = 0;
        const worldAtlasRowOffset = 0 * worldAtlasColumns;
        for (const row of [4, 4, 4, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
            setRowSprite(i++, new TileSprite('world', row + worldAtlasRowOffset));
        }

        // add static props
        const propsSheet = new SpriteSheet(resources.staticProps, 3, 1, 16, 16);
        setRowSprite(8, propsSheet.getSprite(0), 0.1);
        setRowSprite(9, propsSheet.getSprite(1), 0.1);
        setRowSprite(10, propsSheet.getSprite(2), 0.1);

        // add the test fist.
        const f = this.fist = new Actor(0, 0);
        f.onInitialize = function (_engine) { this.addDrawing(resources.fist); };
        f.anchor.setTo(0, 0);
        testScene.add(f);

        // Add the camera focal point actor without any drawing
        const c = this.cameraFocalPoint = new Actor(0, 0);
        testScene.add(c);
        // testScene.camera.addStrategy(new LockCameraToActorAxisStrategy(c, Axis.X));
        testScene.camera.addStrategy(new LockCameraToActorStrategy(c));

        this.excaliburEngine.addScene('test', testScene);
        this.excaliburEngine.goToScene('test');
    }
}