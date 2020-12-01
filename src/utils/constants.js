/** Rudimentary 'debug mode' switch. */
export const NO_LOGO = false;

/** No assumes localhost (127.0.0.1) access. */
export const USE_CLOUD_SERVER = true;

/** Port for socket IO connection. */
export const PORT = 3001;

/** Master volume of all audio. */
export const AUDIO_VOLUME = 0.2;

export const MENU_ROOT = '#menu-root';

/** Max distance to alien active AI. */
export const AI_ACTIVATION_DISTANCE = 100;

/**
 * reserved object IDs:
 * 
 * 0,1  - players
 * 
 * 1xx - testing
 * 
 * 201 - camera focal point
 */
export const R = {
    id: {
        player1: 0,
        player2: 1,
    }
};
