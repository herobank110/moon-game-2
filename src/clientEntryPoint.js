import $ from 'jquery';
import { ClientEngine } from 'lance-gg';
import MoonEngine from './core/moonEngine';
import { makeLiftOffMenu } from './menus/mainMain';
import MoonRenderer from './rendering/moonRenderer';

const options = {
    // traceLevel: Lib.Trace.TRACE_NONE,
    delayInputCount: 3,
    scheduler: 'render-schedule',
    syncOptions: {
        sync: 'extrapolate',
        remoteObjBending: 0.8,
        bendingIncrements: 12
    }
};

// create a client engine and a game engine
const gameEngine = new MoonEngine(options);
const clientEngine = new ClientEngine(gameEngine, options, MoonRenderer);
// save game engine to globals.
window['staticGameEngine'] = gameEngine;

document.addEventListener('DOMContentLoaded', (e) => clientEngine.start());

// Show the main menu (testing! Really, show this after clicking
// start game in excalibur.)
$.ready.then(() => $(document.body).append(makeLiftOffMenu()));