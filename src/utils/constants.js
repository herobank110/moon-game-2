/** Rudimentary 'debug mode' switch. */
export const NO_LOGO = true;

/** No assumes localhost (127.0.0.1) access. */
export const USE_CLOUD_SERVER = false;

/** Port for socket IO connection. */
export const PORT = 3001;

/** Master volume of all audio. */
export const AUDIO_VOLUME = 0.2;

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
