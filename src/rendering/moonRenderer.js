import { Renderer } from 'lance-gg';
import { Actor, Color, Engine as ExEngine, Loader, Scene, SpriteSheet } from 'excalibur';
import resources from './resources';

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
        const a = new Actor();
        a.onInitialize = function (engine) {
            const s = new SpriteSheet(resources.character1, 4, 6, 16, 16);
            this.addDrawing('idle', s.getAnimationBetween(engine, 0, 6, 125));
        };
        const testScene = new Scene(this.excaliburEngine);
        testScene.add(a);
        this.excaliburEngine.addScene('test', testScene);
    }

    draw(t, dt) {
        super.draw(t, dt);

        // Draw the players.
    }
}