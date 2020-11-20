/// <reference types="socket.io"/>

declare module "lance-gg" {
    type Options = object;

    type SubclassOf<T> = { new(...args: any[]): T; }

    interface Bending {
        increments?: number;
        percent: number;
        min?: number;
        max?: number;
    }

    const enum BaseTypesTypes {
        FLOAT32 = 'FLOAT32',
        INT32 = 'INT32',
        INT16 = 'INT16',
        INT8 = 'INT8',
        UINT8 = 'UINT8',
        STRING = 'STRING',
        CLASSINSTANCE = 'CLASSINSTANCE',
        LIST = 'LIST'
    }

    class BaseTypes {
        static TYPES: {
            FLOAT32: BaseTypesTypes.FLOAT32;
            INT32: BaseTypesTypes.INT32;
            INT16: BaseTypesTypes.INT16;
            INT8: BaseTypesTypes.INT8;
            UINT8: BaseTypesTypes.UINT8;
            STRING: BaseTypesTypes.STRING;
            CLASSINSTANCE: BaseTypesTypes.CLASSINSTANCE;
            LIST: BaseTypesTypes.LIST;
        }
    }

    type ClientEngineInputOptions = Partial<{
        verbose: boolean,
        autoConnect: boolean,
        standaloneMode: boolean,
        delayInputCount: number,
        healthCheckInterval: number,
        healthCheckRTTSample: number,
        scheduler: string,
        syncOptions: Partial<{
            sync: 'extrapolate' | 'interpolate' | 'frameSync',
            localObjBending: number,
            remoteObjBending: number,
        }>,
        serverURL: string,
    }>;

    class ClientEngine {
        gameEngine: GameEngine;
        serializer: Serializer;

        constructor(gameEngine: GameEngine, inputOptions: ClientEngineInputOptions, Renderer: SubclassOf<Renderer>);
        start(): Promise<void>;
        connect(options?: object): Promise<void>;
        disconnect(): void;
        sendInput(input: string, inputOptions: object): void;
    }

    type DynamicObjectProps = GameObjectProps & Partial<{
        width: number,
        height: number,
        isStatic: number,
        position: TwoVector,
        velocity: TwoVector,
    }>;

    class DynamicObject extends GameObject implements DynamicObjectProps {
        get maxSpeed(): number | null;
        get x(): number;
        get y(): number;
        width: number;
        height: number;
        angle: number;
        isAccelerating: boolean;
        isRotatingLeft: boolean;
        isRotatingRight: number;
        isStatic: number;
        position: TwoVector;
        velocity: TwoVector;
        acceleration: number;
        friction: TwoVector;
        rotationSpeed: number;

        constructor(gameEngine: GameEngine, options?: GameObjectOptions, props?: DynamicObjectProps);
        accelerate<T extends DynamicObject>(this: T, acceleration: number): T;
        collidesWith(other: DynamicObject): boolean;
        turnLeft<T extends DynamicObject>(this: T, deltaAngle: number): T;
        turnRight<T extends DynamicObject>(this: T, deltaAngle: number): T;
    }

    class GameComponent {
        static get name(): string;
        static get netScheme(): NetScheme | null;
        parentObject: GameObject;
    }

    class GameEngine {
        /** undefined on server */ renderer?: Renderer;
        worldSettings: object;
        world: GameWorld;
        /** NaN on server */ playerId: number;

        constructor(options: { traceLevel: number });
        addObjectToWorld<T extends Object>(object: T): T;
        getPlayerGameOverResult(): object;
        /** Not 100% sure about emit() */ emit(e: string, ...args: any[]): any;
        isOwnedByPlayer(object: object): boolean;
        on(e: string, f: Function): void;
        once(e: string, f: Function): void;
        processInput(
            inputDesc: { input: string, messageIndex: number, options: object, step: number },
            playerId: number,
            isServer: boolean);
        registerClasses(serializer: Serializer);
        removeListener(e: string, f: Function): void;
        removeObjectFromWorld(objectId: number): void;
        start(): void;
        step(isReenact: boolean, t: number, dt: number, physicsOnly: boolean);
    }

    type GameObjectProps = Partial<{
        playerId: number
    }>;

    type GameObjectOptions = Partial<{
        id: number
    }>;

    type NetScheme = { [key: string]: { type: BaseTypesTypes; }; };

    class GameObject implements GameObjectProps {
        static get netScheme(): NetScheme;
        get bending(): { [key: string]: Bending };
        gameEngine: GameEngine;
        id: number;
        /** Owner ID */ playerId: number;

        constructor(gameEngine: GameEngine, options?: GameObjectOptions, props?: GameObjectProps);

        addComponent(componentInstance: GameComponent): void;
        getComponent<T extends GameComponent>(componentClass: SubclassOf<T>): T | undefined;
        hasComponent(componentClass: SubclassOf<GameComponent>): boolean
        removeComponent(componentName: string): void;

        onAddToWorld(gameEngine: GameEngine): void;
        onRemoveFromWorld(gameEngine: GameEngine): void;

        syncTo<T extends GameObject>(this: T, other: T): void;

        bendingToString(): string;
        toString(): string;
    }

    type GameWorldQuery<T> = Partial<{
        id: number;
        playerId: number;
        instanceType: SubclassOf<T>;
        components: GameComponent[];
        returnSingle: boolean;
    }>;

    class GameWorld {
        constructor();
        forEachObject(callback: (objId: number, obj: any) => void | false): void;
        queryObject<T>(query: GameWorldQuery<T>): T | null;
        queryObjects<T>(query: GameWorldQuery<T>): T[];
    }

    interface BindKeyParameters {
        repeat: boolean;
    }

    class KeyboardControls {
        constructor(clientEngine: ClientEngine);
        bindKey(keys: string | string[], actionName: string,
            parameters?: { repeat: boolean } | (() => ({ repeat: boolean })),
            options?: object);
    }

    class Lib {
        static Trace: typeof Trace;
    }

    interface PhysicalObject2DProps extends GameObjectProps {
        position: TwoVector;
        velocity: TwoVector;
        angle: number;
        mass: number;
        angularVelocity: number;
    }

    class PhysicalObject2D extends GameObject implements PhysicalObject2DProps {
        position: TwoVector;
        velocity: TwoVector;
        angle: number;
        mass: number;
        angularVelocity: number;

        constructor(gameEngine: GameEngine, options?: GameObjectOptions,
            props?: PhysicalObject2DProps);
    }

    interface PhysicalObject3DProps extends GameObjectProps {
        position: ThreeVector;
        velocity: ThreeVector;
        quaternion: Quaternion;
        angularVelocity: ThreeVector;
    }

    class PhysicalObject3D extends GameObject implements PhysicalObject3DProps {
        position: ThreeVector;
        velocity: ThreeVector;
        quaternion: Quaternion;
        angularVelocity: ThreeVector;

        constructor(gameEngine: GameEngine, options?: GameObjectOptions,
            props?: PhysicalObject3DProps);
    }

    class Quaternion {
        w: number;
        x: number;
        y: number;
        z: number;
        constructor(w: number, x: number, y: number, z: number);

        conjugate(): Quaternion;
        copy(sourceObj: Quaternion): Quaternion;
        multiply(other: Quaternion): Quaternion;
        set(w: number, x: number, y: number, z: number);
        setFromAxisAngle(axis: number, angle: number): Quaternion
        slerp(target: Quaternion, bending: number): Quaternion;
        toAxisAngle(): { axis: ThreeVector, angle: number };
        toString(): string;
    }

    class Renderer {
        static getInstance(): Renderer;
        clientEngine: ClientEngine;
        gameEngine: GameEngine;

        constructor(gameEngine: GameEngine, clientEngine: ClientEngine);
        /** virtual */ addObject(obj: any): void;
        draw(t: number, dt: number): void;
        init(): Promise<void>;
        /** virtual */ removeObject(obj: any): void;
        runClientStep(t: number, dt: number): void;
        /** virtual */ stop(): void;
    }

    class Serializer {
        constructor();
        static typeCanAssign(type: BaseTypesTypes): boolean;
        addCustomType(customType: any): void;
        registerClass(classObj: SubclassOf<object>, classId?: string): void;
    }

    type ServerEngineOptions = Partial<{
        stepRate: number;
        updateRate: number;
        fullSyncRate: number;
        tracesPath: string;
        countConnections: boolean;
        updateOnObjectCreation: boolean;
        timeoutInterval: number;
        debug: Partial<{ serverSendLag: boolean }>
    }>;

    class ServerEngine {
        serializer: Serializer;
        gameEngine: GameEngine;
        DEFAULT_ROOM_NAME: string;
        connectedPlayers: { socket: typeof SocketIO, state: string, roomName: string }[];

        constructor(io: SocketIO.Server, gameEngine: GameEngine, options: ServerEngineOptions);
        assignObjectToRoom(obj: any, roomName: string): void;
        assignPlayerToRoom(playerId: number, roomName: string): void;
        createRoom(roomName: string): void;
        gameStatus(): string;
        start(): void;
    }

    class SimplePhysicsEngine {
        gravity: TwoVector;

        constructor(options: {
            collisions?: {
                type?: 'HSHG' | 'bruteForce',
                collisionDistance?: number,
                autoResolve?: boolean
            },
            collisionOptions?: { gameEngine?: GameEngine },
            gameEngine: GameEngine,
            gravity?: TwoVector
        });
    }

    class ThreeVector {
        x: number;
        y: number;
        z: number;

        constructor(x: number, y: number, z: number);
        add(other: ThreeVector): ThreeVector
        clone(): ThreeVector;
        copy(sourceObj: ThreeVector): ThreeVector;
        getBendingDelta(target: ThreeVector, options: Bending): ThreeVector;
        length(): number;
        lerp(target: ThreeVector, p: number): ThreeVector;
        multiplyScalar(s: number): ThreeVector;
        normalize(): ThreeVector;
        set(x: number, y: number, z: number): ThreeVector;
        subtract(other: ThreeVector): ThreeVector;
        toString(): string;
    }

    enum TraceLevel {
        TRACE_ALL = 0,
        TRACE_DEBUG = 1,
        TRACE_INFO = 2,
        TRACE_WARN = 3,
        TRACE_ERROR = 4,
        TRACE_NONE = 100
    }

    class Trace {
        static get TRACE_ALL(): TraceLevel.TRACE_ALL;
        static get TRACE_DEBUG(): TraceLevel.TRACE_DEBUG;
        static get TRACE_INFO(): TraceLevel.TRACE_INFO;
        static get TRACE_WARN(): TraceLevel.TRACE_WARN;
        static get TRACE_ERROR(): TraceLevel.TRACE_ERROR;
        static get TRACE_NONE(): TraceLevel.TRACE_NONE;

        constructor(options: { traceLevel: TraceLevel });
    }

    class TwoVector {
        x: number;
        y: number;

        constructor(x: number, y: number);
        add(other: TwoVector): TwoVector;
        clone(): TwoVector;
        copy(sourceObj: TwoVector): TwoVector;
        getBendingDelta(target: TwoVector, options: Bending): TwoVector;
        length(): number;
        lerp(target: TwoVector, p: number): TwoVector;
        multiplyScalar(s: number): TwoVector
        normalize(): TwoVector;
        set(x: number, y: number);
        subtract(other: TwoVector): TwoVector;
        toString(): string;
    }
}