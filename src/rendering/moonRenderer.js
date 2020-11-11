import { Renderer } from 'lance-gg';
import { Actor, Color, Engine as ExEngine, Loader, LockCameraToActorStrategy, Scene, SpriteSheet } from 'excalibur';
import resources from './resources';
import Player from '../core/player';

export default class MoonRenderer extends Renderer {
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
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
            this.addDrawing('walk_r', s.getAnimationBetween(engine, 0, 6, 125));
            this.addDrawing('walk_l', s.getAnimationBetween(engine, 6, 12, 125));
            this.addDrawing('idle_r', s.getAnimationBetween(engine, 12, 18, 125));
            this.addDrawing('idle_l', s.getAnimationBetween(engine, 18, 24, 125));
            this.addDrawing('attack_r', s.getSprite(24));
            this.addDrawing('attack_l', s.getSprite(25));
            this.setDrawing('attack_l');
        };
        const testScene = new Scene(this.excaliburEngine);
        testScene.add(a);
        testScene.camera.zoom(5);
        // TODO make a custom strategy to lock to two players
        testScene.camera.addStrategy(new LockCameraToActorStrategy(a));
        this.excaliburEngine.addScene('test', testScene);
        this.excaliburEngine.goToScene('test');
    }

    draw(t, dt) {
        super.draw(t, dt);
    }
}