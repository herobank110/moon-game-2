import { ClientEngine } from 'lance-gg';
import MoonEngine from './core/moonEngine';
import MoonRenderer from './rendering/moonRenderer';
import { PORT, USE_CLOUD_SERVER } from './utils/constants';

const options = {
    // traceLevel: Lib.Trace.TRACE_NONE,
    delayInputCount: 3,
    scheduler: 'render-schedule',
    syncOptions: {
        sync: 'extrapolate',
        remoteObjBending: 0.8,
        bendingIncrements: 12
    },
    serverURL: `http://${USE_CLOUD_SERVER ? '144.126.196.39' : '127.0.0.1'}:${PORT}`
};

// create a client engine and a game engine
const gameEngine = new MoonEngine(options);
const clientEngine = new ClientEngine(gameEngine, options, MoonRenderer);
// save game engine to globals.
window['staticGameEngine'] = gameEngine;

document.addEventListener('DOMContentLoaded', (e) => clientEngine.start());