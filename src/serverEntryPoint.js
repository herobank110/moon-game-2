import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import { Lib, ServerEngine } from 'lance-gg';
import MoonEngine from './core/moonEngine';

const PORT = process.env.PORT || 3001;

// define routes and socket
const server = express();
server.get('/', (req, res) => { res.sendFile(path.join(__dirname, '../dist/index.html')); });
server.use('/', express.static(path.join(__dirname, '../dist/')));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(requestHandler);

// Game Instances
const gameEngine = new MoonEngine({ traceLevel: Lib.Trace.TRACE_NONE });
const serverEngine = new ServerEngine(io, gameEngine, { debug: {}, updateRate: 12 });

// save game engine to globals.
global['staticGameEngine'] = gameEngine;

// start the game
serverEngine.start();