import { Lib, ClientEngine } from 'lance-gg';
import MoonEngine from './core/moonEngine';
import MoonRenderer from './rendering/moonRenderer';

const options = {
    // traceLevel: Lib.Trace.TRACE_NONE,
    delayInputCount: 3,
    scheduler: 'render-schedule',
    syncOptions: {
        sync: 'extrapolate',
        remoteObjBending: 0.8,
        bendingIncrements: 6
    }
};

// create a client engine and a game engine
const gameEngine = new MoonEngine(options);
const clientEngine = new ClientEngine(gameEngine, options, MoonRenderer);

document.addEventListener('DOMContentLoaded', (e) => clientEngine.start());