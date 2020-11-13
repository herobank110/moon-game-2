import { DynamicObject, Renderer } from 'lance-gg';
import { Actor, Color, Engine as ExEngine, Loader, Scene, SpriteSheet, TileMap, TileSprite, Vector } from 'excalibur';
import resources from './resources';
import Player from '../pawns/player';

const worldAtlasRows = 3;
const worldAtlasColumns = 5;

export default class MoonRenderer extends Renderer {
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.showCollision = false;
    }

    init() {
        // Create the excalibur engine.
        this.initExcalibur();

        return super.init();
    }

    initExcalibur() {
        this.excaliburEngine = new ExEngine({
            antialiasing: false,
            backgroundColor: Color.Azure,
        });
        const loader = new Loader(Object.values(resources));
        this.excaliburEngine.start(loader)
            .then(() => this.makeTestExcaliburScene());
    }

    makeTestExcaliburScene() {
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
        testScene.camera.zoom(7);
        // TODO make a custom strategy to lock to two players
        // testScene.camera.addStrategy(new LockCameraToActorStrategy(a));

        // Add the world tile map.
        const tileMap = new TileMap({
            x: 0, y: 0,
            cellWidth: 16, cellHeight: 16,
            rows: 40, cols: 100
        });
        tileMap.registerSpriteSheet('world', new SpriteSheet(resources.world, worldAtlasColumns, worldAtlasRows, 16, 16));
        testScene.add(tileMap);

        // assumes all sprites in the row use the same sprite.
        const setRowSprite = (row, spr) => {
            for (let x = 0; x < 100; x++) {
                tileMap.getCell(x, row).pushSprite(spr);
            }
        }

        let i = 0;
        const worldAtlasRowOffset = 0 * worldAtlasColumns;
        for (const row of [4, 4, 4, 3, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
            setRowSprite(i++, new TileSprite('world', row + worldAtlasRowOffset));
        }

        this.excaliburEngine.addScene('test', testScene);
        this.excaliburEngine.goToScene('test');
    }

    draw(t, dt) {
        super.draw(t, dt);

        // Get the first player (testing only!)
        const player = this.gameEngine.world.queryObject({ instanceType: Player });

        if (player && this.a) {
            this.a.pos.setTo(player.position.x, player.position.y);
            this.a.setDrawing(this.getAnimState(player));
        }

        if (this.showCollision) {
            this.gameEngine.world.queryObjects({ instanceType: DynamicObject }).forEach((obj) => {
                // console.log(obj.constructor);
                const bl = this.excaliburEngine.worldToScreenCoordinates(new Vector(obj.position.x, obj.position.y));
                const sz = this.excaliburEngine.worldToScreenCoordinates(new Vector(obj.width, obj.height));
                const ctx = this.excaliburEngine.ctx;
                ctx.strokeStyle = (obj.isStatic ? Color.Magenta : Color.Orange).toHex();
                ctx.strokeRect(bl.x, bl.y, sz.x, sz.y);
            });
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
}